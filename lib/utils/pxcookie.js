'use strict';
const pxConfig = require('../pxconfig');
const pxLogger = require('./pxlogger');
const CookieV1 = require('./cookie/cookieV1');
const CookieV3 = require('./cookie/cookieV3');

exports.evalCookie = evalCookie;

/**
 * evalCookie - main cookie evaluation function. dectypt, decode and verify cookie content. if score.
 *
 * @param {Object} pxCtx - current request context.
 *
 * @return {Number} evaluation results, derived from configured enum on PX_DEFAULT.COOKIE_EVAL. possible values: (NO_COOKIE, COOKIE_INVALID, COOKIE_EXPIRED, UNEXPECTED_RESULT, BAD_SCORE, GOOD_SCORE).
 *
 */
function evalCookie(pxCtx) {
    const config = pxConfig.conf;
    try {
        if (Object.keys(pxCtx.cookies).length === 0) {
            pxLogger.debug('No cookie found, pause cookie evaluation');
            pxCtx.s2sCallReason = 'no_cookie';
            return config.SCORE_EVALUATE_ACTION.NO_COOKIE;
        }


        const cookieKey = config.COOKIE_SECRET_KEY;
        if (!cookieKey) {
            pxLogger.debug('No cookie key found, pause cookie evaluation');
            return config.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT;
        }

        const cookie = pxCookieFactory(pxCtx, config);
        if (!cookie.deserialize()) {
            pxLogger.debug('Invalid cookie, pause cookie evaluation');
            pxCtx.s2sCallReason = 'cookie_decryption_failed';
            pxCtx.px_orig_cookie = getPxCookieFromContext(pxCtx);
            return config.SCORE_EVALUATE_ACTION.COOKIE_INVALID;
        }

        pxCtx.decodedCookie = cookie.decodedCookie;
        pxCtx.score = cookie.score;
        pxCtx.vid = cookie.vid;
        pxCtx.uuid = cookie.uuid;
        pxCtx.blockAction = cookie.blockAction;

        if (cookie.isExpired()) {
            pxLogger.debug('cookie invalid, expired');
            pxCtx.s2sCallReason = 'cookie_expired';
            return config.SCORE_EVALUATE_ACTION.COOKIE_EXPIRED;
        }

        if (cookie.isHighScore()) {
            pxLogger.debug('cookie high score');
            return config.SCORE_EVALUATE_ACTION.BAD_SCORE;
        }

        if (!cookie.isSecure()) {
            pxLogger.debug('cookie invalid ' + JSON.stringify(cookie.decodedCookie));
            pxCtx.s2sCallReason = 'cookie_validation_failed';
            return config.SCORE_EVALUATE_ACTION.COOKIE_INVALID;
        }

        if (pxCtx.sensitiveRoute){
            pxLogger.debug('cookie validation passed but uri is a sensitive route');
            pxCtx.s2sCallReason = 'sensitive_route';
            return config.SCORE_EVALUATE_ACTION.SENSITIVE_ROUTE;
        }

        return config.SCORE_EVALUATE_ACTION.GOOD_SCORE;
    } catch (e) {
        pxLogger.error('Error while evaluate perimeterx cookie. ' + e.message);
        pxCtx.s2sCallReason = 'cookie_decryption_failed';
        return config.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT;
    }
}

/**
 * Factory method for creating PX Cookie object according to cookie version found on the request
 */
function pxCookieFactory(ctx, config) {
    if (ctx.cookies['_px3']) {
        return new CookieV3(ctx, config);
    }
    return new CookieV1(ctx, config);
}

function getPxCookieFromContext(pxCtx){
    if (Object.keys(pxCtx.cookies).length){
        return pxCtx.cookies["_px3"] ? pxCtx.cookies["_px3"] : pxCtx.cookies["_px"]
    }
}
