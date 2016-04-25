"use strict";

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 0.1 Published 05 April 2016
 */

const moment = require('moment');
const crypto = require('crypto');
const uuid = require('node-uuid');
const pxconfig = require('../lib/pxconfig');


exports.goodValidCookie = buildCookieGoodScoreValid;
exports.badValidCookie = badValidCookie;

const cookieGood = {
    u: uuid.v1(),
    s: {
        b: 0,
        a: 0
    }
};

const cookieBad = {
    u: uuid.v1(),
    s: {
        b: 100,
        a: 0
    }
};

/**
 * buildCookieGoodScoreValid - generate a good and valid cookie for test purposes
 *
 * @param {string} ip - IP address
 * @param {string} ua - User Agent
 * @param {string} cookieKey - cookie secret to sign cookie with
 *
 */
function buildCookieGoodScoreValid(ip, ua, cookieKey) {
    const ts = moment().add(10, 'minutes').format('x');
    return encryptCookie(buildCookie(cookieGood, ip, ua, ts, cookieKey), cookieKey);
}
/**
 * buildCookieGoodScoreValid - generate a good and valid cookie for test purposes
 *
 * @param {string} ip - IP address
 * @param {string} ua - User Agent
 * @param {string} cookieKey - cookie secret to sign cookie with
 *
 */
function badValidCookie(ip, ua, cookieKey) {
    const ts = moment().add(10, 'minutes').format('x');
    return encryptCookie(buildCookie(cookieBad, ip, ua, ts, cookieKey), cookieKey);
}


/**
 * buildCookie - util function to generate a decrypted px cookie for a given cookie object
 *
 * @param {Object} cookie - cookie object to decrypt
 * @param {string} ip - IP address
 * @param {string} ua - User Agent
 * @param {number} ts - timestamp of the cookie validity
 * @param {string} cookieKey - cookie secret to sign cookie with
 *
 */
function buildCookie(cookie, ip, ua, ts, cookieKey) {
    const cksum = crypto.createHmac(pxconfig.CE_DIGEST, cookieKey);

    /* add validity time */
    cookie.t = Number(ts);
    cksum.update(ts);

    /* update scores */
    cksum.update(cookie.s.b.toString());
    cksum.update(cookie.s.a.toString());

    /* update uuid */
    cksum.update(cookie.u);

    /* update ip */
    cksum.update(ip);

    /* update ua */
    cksum.update(ua);

    cookie.h = cksum.digest('hex');

    return cookie;
}

function encryptCookie(cookie, cookieKey) {
    // create cipher
    let result;
    let cipher;
    const salt = crypto.randomBytes(64);
    const derivation = crypto.pbkdf2Sync(cookieKey, salt, pxconfig.CE_ITERATIONS, pxconfig.CE_IVLEN + pxconfig.CE_KEYLEN, pxconfig.CE_DIGEST);
    const key = derivation.slice(0, 32);
    const iv = derivation.slice(32);
    cipher = crypto.createCipheriv(pxconfig.CE_ALGO, key, iv);
    result = salt.toString('base64') + ':1000:';
    // encrypt data
    result += cipher.update(JSON.stringify(cookie), 'utf8', 'base64');
    result += cipher.final('base64');
    return result;
}
