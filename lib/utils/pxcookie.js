'use strict';
const pxconfig = require('../pxconfig').conf();
const pxlogger = require('./pxlogger');
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
    try {
        if (Object.keys(pxCtx.cookies).length === 0) {
            pxlogger.debug('No cookie found, pause cookie evaluation');
            pxCtx.s2s_call_reason = 'no_cookie';
            return pxconfig.SCORE_EVALUATE_ACTION.NO_COOKIE;
        }


        const cookieKey = pxconfig.COOKIE_SECRET_KEY;
        if (!cookieKey) {
            pxlogger.debug('No cookie key found, pause cookie evaluation');
            return pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT;
        }

        const cookie = pxCookieFactory(pxCtx, pxconfig);
        if (!cookie.deserialize()) {
            pxlogger.debug('Invalid cookie, pause cookie evaluation');
            pxCtx.s2s_call_reason = 'cookie_decryption_failed';
            pxCtx.px_orig_cookie = getPxCookieFromContext(pxCtx); 
            return pxconfig.SCORE_EVALUATE_ACTION.COOKIE_INVALID;
        }

        pxCtx.decrypted_px_cookie = cookie.decodedCookie;
        pxCtx.block_score = cookie.score;
        pxCtx.px_vid = cookie.vid;
        pxCtx.uuid = cookie.uuid;
        pxCtx.block_action = cookie.blockAction;

        if (cookie.isExpired()) {
            pxlogger.debug('cookie invalid, expired');
            pxCtx.s2s_call_reason = 'cookie_expired';
            return pxconfig.SCORE_EVALUATE_ACTION.COOKIE_EXPIRED;
        }

        if (cookie.isHighScore()) {
            pxlogger.debug('cookie high score');
            return pxconfig.SCORE_EVALUATE_ACTION.BAD_SCORE;
        }

        if (!cookie.isSecure()) {
            pxlogger.debug('cookie invalid ' + JSON.stringify(cookie.decodedCookie));
            pxCtx.s2s_call_reason = 'cookie_validation_failed';
            return pxconfig.SCORE_EVALUATE_ACTION.COOKIE_INVALID;
        }

        if (pxCtx.sensitive_route){
            pxlogger.debug('cookie validation passed but uri is a sensitive route');
            pxCtx.s2s_call_reason = 'sensitive_route';
            return pxconfig.SCORE_EVALUATE_ACTION.SENSITIVE_ROUTE;
        }

        return pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE;
    } catch (e) {
        pxlogger.error('Error while evaluate perimeterx cookie. ' + e.message);
        pxCtx.s2s_call_reason = 'cookie_decryption_failed';
        pxCtx.px_orig_cookie = getPxCookieFromContext(pxCtx); 
        return pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT;
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
