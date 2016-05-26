'use strict';
const crypto = require('crypto');
const pxconfig = require('../pxconfig').conf();
const pxlogger = require('./pxlogger');

exports.evalCookie = evalCookie;

/**
 * decryptCookie - Decrypt a raw perimeterx cookie into a json holding the risk score of the user .
 *
 * @param {String} cookieKey - Cookie secret key.
 * @param {String} cookie - Cookie raw value.
 *
 * @return {String} An express middleware.
 */
function decryptCookie(cookieKey, cookie) {
    const data = cookie.split(':');
    if (data.length !== 3) {
        pxlogger.debug('invalid cookie format');
        return '';
    }
    const iterations = Number(data[1]);
    const encryptedCookie = data[2];
    /* iterations value is not a number */
    if (!iterations) {
        pxlogger.debug('invalid cookie format');
        return '';
    }

    /* iterations value is not in the legit range */
    if (iterations > 5000 || iterations < 500) {
        pxlogger.debug('invalid cookie format');
        return '';
    }

    /* salt value is not as expected */
    if (!data[0] || typeof data[0] !== 'string' || data[0].length > 100) {
        pxlogger.debug('invalid cookie format');
        return '';
    }

    /* cookie value is not as expected */
    if (!encryptedCookie || typeof encryptedCookie !== 'string') {
        pxlogger.debug('invalid cookie format');
        return '';
    }

    const salt = new Buffer(data[0], 'base64');
    const derivation = crypto.pbkdf2Sync(cookieKey, salt, iterations, pxconfig.CE_KEYLEN + pxconfig.CE_IVLEN, pxconfig.CE_DIGEST);
    const key = derivation.slice(0, pxconfig.CE_KEYLEN);
    const iv = derivation.slice(pxconfig.CE_KEYLEN);

    const cipher = crypto.createDecipheriv(pxconfig.CE_ALGO, key, iv);
    let decrypted = cipher.update(encryptedCookie, 'base64', 'utf8');
    decrypted += cipher.final('utf8');

    return JSON.parse(decrypted);
}

/**
 * isCookieValid - validate cookie content by checking it's hmac signing match the expected.
 *
 * @param {String} cookieKey - Cookie secret key.
 * @param {String} cookie - Cookie raw value.
 * @param {String} ip - user ip, used to validate cookie signing.
 * @param {String} ua - user's useragent, also used to validate cookie signing.
 *
 * @return {Boolean} indicator to the validity of the cookie.
 */
function isCookieValid(cookie, cookieKey, ip, ua) {
    try {
        if (!cookie || !cookie.h || !cookie.t || !cookie.s) {
            return false;
        }
        const hmac = crypto.createHmac(pxconfig.CE_DIGEST, cookieKey);
        const ts = cookie.t.toString();
        hmac.update(ts);

        for (let k of Object.keys(cookie.s).sort()) {
            const score = cookie.s[k].toString();
            hmac.update(score);
        }
        if (cookie.u) {
            hmac.update(cookie.u);
        }
        if (cookie.v) {
            hmac.update(cookie.v);
        }

        hmac.update(ip);

        hmac.update(ua);

        const h = hmac.digest('hex');
        return (cookie.h === h);
    } catch (e) {
        console.error('Error white validating perimeterx cookie', e.stack);
        return false;
    }
}

/**
 * isCookieTimeValid - check the timestamp of the cookie is valid.
 *
 * @param {String} cookie - Cookie secret key.
 *
 * @return {Boolean} indicator to the validity of the cookie.
 */
function isCookieTimeValid(cookie) {
    if (!cookie || !cookie.t) {
        return false;
    }
    const now = new Date().getTime();
    return (cookie.t > now);
}

/**
 * processCookieScore - processing cookie score and return a block indicator.
 *
 * @param {object} decryptedCookie - Cookie secret key.
 * @param {Object} pxCtx - current request context.
 *
 * @return {Boolean} indicator to the cookie score.
 *
 */
function isBadRiskScore(decryptedCookie, pxCtx) {
    if (!decryptedCookie || !decryptedCookie.s) {
        pxlogger.debug('Decrypted cookie has no score');
        return false;
    }

    let score = Math.max(Number(decryptedCookie.s.b), Number(decryptedCookie.s.a));
    if (score >= pxconfig.BLOCKING_SCORE) {
        pxCtx.block_score = score;
        return true;
    }

    return false
}

/**
 * evalCookie - main cookie evaluation function. dectypt, decode and verify cookie content. if score.
 *
 * @param {String} cookie - cookie raw value.
 * @param {String} ip - user ip, used to validate cookie signing.
 * @param {String} ua - user's useragent, also used to validate cookie signing.
 * @param {Object} pxCtx - current request context.
 *
 * @return {Number} evaluation results, derived from configured enum on PX_DEFAULT.COOKIE_EVAL. possible values: (NO_COOKIE, COOKIE_INVALID, COOKIE_EXPIRED, UNEXPECTED_RESULT, BAD_SCORE, GOOD_SCORE).
 *
 */
function evalCookie(cookie, ip, ua, pxCtx) {
    if (!cookie) {
        pxlogger.debug('No cookie found, pause cookie evaluation');
        return pxconfig.SCORE_EVALUATE_ACTION.NO_COOKIE;
    }
    const cookieKey = pxconfig.COOKIE_SECRET_KEY;
    if (!cookieKey) {
        pxlogger.debug('No cookie key found, pause cookie evaluation');
        return pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT;
    }
    try {
        let decryptedCookie;
        if (pxconfig.COOKIE_ENCRYPTION) {
            decryptedCookie = decryptCookie(cookieKey, cookie);
        } else {
            decryptedCookie = new Buffer(cookie, 'base64').toString('utf8');
        }

        if (!decryptedCookie) {
            return pxconfig.SCORE_EVALUATE_ACTION.COOKIE_INVALID;
        }

        /* evaluation risk score */
        if (isBadRiskScore(decryptedCookie, pxCtx)) {
            pxCtx.block_uuid = decryptedCookie.u || '';
            pxCtx.px_vid = decryptedCookie.v || '';
            return pxconfig.SCORE_EVALUATE_ACTION.BAD_SCORE;
        }

        /* risk score is not a bad score, need to validate the cookie and its expiry */
        if (!isCookieValid(decryptedCookie, cookieKey, ip, ua)) {
            pxlogger.debug('cookie invalid ' + JSON.stringify(decryptedCookie));
            return pxconfig.SCORE_EVALUATE_ACTION.COOKIE_INVALID;
        }

        if (!isCookieTimeValid(decryptedCookie)) {
            pxlogger.debug('cookie invalid, expired');
            return pxconfig.SCORE_EVALUATE_ACTION.COOKIE_EXPIRED;
        }

        return pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE;
    } catch (e) {
        pxlogger.error('Error while evaluate perimeterx cookie. ' + e.message);
        return pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT;
    }
}
