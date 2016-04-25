'use strict';
const crypto = require('crypto');
const pxconfig = require('../pxconfig');
const pxlogger = require('./pxlogger');

exports.evalCookie = evalCookie;

/**
 * decryptCookie - Decrypt a raw perimeterx cookie into a json holding the risk score of the user .
 *
 * @param {String} cookieKey - Cookie secret key.
 * @param {String} cookie - Cookie raw value.
 *
 * @return {Function} An express middleware.
 */
function decryptCookie(cookieKey, cookie) {
    const data = cookie.split(':');
    if (data.length !== 3) {
        throw new Error('invalid cookie format');
    }

    const iterations = Number(data[1]);

    if (iterations > 5000) {
        throw new Error('Number of iterations is too high');
    }

    const salt = new Buffer(data[0], 'base64');
    const encryptedCookie = data[2];
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

        hmac.update(cookie.u);
        hmac.update(ip);
        hmac.update(ua);

        const h = hmac.digest('hex');
        console.log(h);
        console.log(cookie.h );

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
 *
 * @return {Boolean} indicator to the cookie score.
 *
 */
function isBadRiskScore(decryptedCookie) {
    if (!decryptedCookie || !decryptedCookie.s) {
        pxlogger.debug('Decrypted cookie has no score');
        return false;
    }

    let score = Math.max(Number(decryptedCookie.s.b), Number(decryptedCookie.s.a));
    return score >= pxconfig.BLOCKING_SCORE;
}

/**
 * evalCookie - main cookie evaluation function. dectypt, decode and verify cookie content. if score.
 *
 * @param {String} cookie - cookie raw value.
 * @param {String} ip - user ip, used to validate cookie signing.
 * @param {String} ua - user's useragent, also used to validate cookie signing.
 *
 * @return {Number} evaluation results, derived from configured enum on PX_DEFAULT.COOKIE_EVAL. possible values: (NO_COOKIE, COOKIE_INVALID, COOKIE_EXPIRED, UNEXPECTED_RESULT, BAD_SCORE, GOOD_SCORE).
 *
 */
function evalCookie(cookie, ip, ua) {
    if (!cookie) {
        pxlogger.debug('No cookie found, pause cookie evaluation');
        return pxconfig.COOKIE_EVAL.NO_COOKIE;
    }

    const cookieKey = pxconfig.COOKIE_SECRET_KEY;
    if (!cookieKey) {
        pxlogger.debug('No cookie key found, pause cookie evaluation');
        return pxconfig.COOKIE_EVAL.UNEXPECTED_RESULT;
    }
    try {
        let decryptedCookie;
        if (pxconfig.COOKIE_ENCRYPTION) {
            decryptedCookie = decryptCookie(cookieKey, cookie);
        } else {
            decryptedCookie = new Buffer(cookie, 'base64').toString('utf8');
        }

        /* evaluation risk score */
        if (isBadRiskScore(decryptedCookie)){
            return pxconfig.COOKIE_EVAL.COOKIE_BAD_SCORE;
        }

        /* risk score is not a bad score, need to validate the cookie and its expiry */
        if (!isCookieValid(decryptedCookie, cookieKey, ip, ua)) {
            pxlogger.debug('cookie invalid', decryptedCookie);
            return pxconfig.COOKIE_EVAL.COOKIE_INVALID;
        }

        if (!isCookieTimeValid(decryptedCookie)) {
            pxlogger.debug('cookie invalid, expired');
            return pxconfig.COOKIE_EVAL.COOKIE_EXPIRED;
        }

        return pxconfig.COOKIE_EVAL.COOKIE_GOOD_SCORE;
    } catch (e) {
        pxlogger.error('Error while evaluate perimeterx cookie. ' + e.message);
        return pxconfig.COOKIE_EVAL.UNEXPECTED_RESULT;
    }
}