'use strict';

const pxCookie = require('./pxcookie');
const pxApi = require('./pxapi');
const pxlogger = require('./pxlogger');
const pxutil = require('./pxutil');
const request = require('request');
const pxhttpc = require('./pxhttpc');

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 1.0 Published 12 May 2016
 */
exports.verifyUserScore = verifyUserScore;
exports.verifyCaptcha = verifyCaptcha;
exports.formatHeaders = formatHeaders;
exports.checkForStatic = checkForStatic;

/**
 * verifyUserScore - Verify function, evaluate score by cookie and s2s and make the return an action.
 *
 * @param {Object} pxCtx - current request context.
 *        {string} pxCtx.cookie - user's px cookie.
 *        {string} pxCtx.ip - user's ip address.
 *        {Array} pxCtx.headers - array of user's request headers in a name value format. (example: [{name: 'User-Agent', value: 'PhantomJS'}]
 *        {string} pxCtx.uri - current request uri
 * @param {Function} callback - callback function.
 */
function verifyUserScore(pxCtx, callback) {
    const pxconfig = require('../pxconfig').conf();
    const cookie = pxCtx._px;
    const ip = pxCtx.ip;
    const headers = pxCtx.headers;
    const uri = pxCtx.uri;

    try {
        if (!ip || !headers || !uri) {
            pxlogger.error('perimeterx score evaluation failed. bad parameters.');
            return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
        }
        const userAgent = headers['user-agent'] || headers['User-Agent'] || 'none';

        let action = pxCookie.evalCookie(cookie, ip, userAgent, pxCtx);
        /* score did not cross threshold - pass traffic */
        if (action === pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE) {
            return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
        }

        /* score crossed threshold - block traffic */
        if (action === pxconfig.SCORE_EVALUATE_ACTION.BAD_SCORE) {
            return callback(pxconfig.SCORE_EVALUATE_ACTION.COOKIE_BLOCK_TRAFFIC);
        }

        /* when no fallback to s2s call if cookie does not exist or failed on evaluation */
        pxApi.evalByServerCall(pxCtx, action, (action) => {
            if (action === pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT) {
                pxlogger.error('perimeterx score evaluation failed. unexpected error. passing traffic');
                return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
            }

            if (action === pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE) {
                return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
            }

            if (action === pxconfig.SCORE_EVALUATE_ACTION.BAD_SCORE) {
                return callback(pxconfig.SCORE_EVALUATE_ACTION.S2S_BLOCK_TRAFFIC);
            }
        });
    } catch (e) {
        pxlogger.error('perimeterx score evaluation failed. unexpected error. ' + e.message);
        return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
    }
}


/**
 * formatHeaders - Build request headers in the server2server format.
 *
 * @param {Object} headers - request headers in key value format.
 * @return {Array} request headers an array format.
 */
function formatHeaders(headers) {
    const retval = [];
    try {
        if (!headers || typeof headers !== 'object' || Object.keys(headers).length === 0) {
            return retval;
        }

        for (let header in headers) {
            if (header && headers[header]) {
                retval.push({name: header, value: headers[header]});
            }
        }
        return retval;
    } catch (e) {
        return retval;
    }
}


/**
 * checkForStatic - check if the request destination is a static file.
 * @param {object} req - the request object
 * @param {Array} exts - list of static file extensions
 *
 * @return {Boolean} true if the target is ststic file/false otherwise.
 */
function checkForStatic(req, exts) {
    const path = req.path;

    for (let i = 0; i < exts.length; i++) {
        if (path.endsWith(exts[i])) {
            return true;
        }
    }

    return false;
}