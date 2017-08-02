'use strict';

const pxCookie = require('./pxcookie');
const pxApi = require('./pxapi');
const pxLogger = require('./pxlogger');

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 1.0 Published 12 May 2016
 */
exports.verifyUserScore = verifyUserScore;
exports.filterSensitiveHeaders = filterSensitiveHeaders;
exports.formatHeaders = formatHeaders;
exports.checkForStatic = checkForStatic;
exports.verifyDefined = verifyDefined;


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
    const pxConfig = require('../pxconfig').conf;
    try {
        if (!pxCtx.ip || !pxCtx.uri) {
            pxLogger.error('perimeterx score evaluation failed. bad parameters.');
            return callback(pxConfig.SCORE_EVALUATE_ACTION.COOKIE_PASS_TRAFFIC);
        }

        let action = pxCookie.evalCookie(pxCtx);
        /* score did not cross threshold - pass traffic */
        if (action === pxConfig.SCORE_EVALUATE_ACTION.GOOD_SCORE) {
            return callback(pxConfig.SCORE_EVALUATE_ACTION.COOKIE_PASS_TRAFFIC);
        }

        /* score crossed threshold - block traffic */
        if (action === pxConfig.SCORE_EVALUATE_ACTION.BAD_SCORE) {
            return callback(pxConfig.SCORE_EVALUATE_ACTION.COOKIE_BLOCK_TRAFFIC);
        }

        /* when no fallback to s2s call if cookie does not exist or failed on evaluation */
        pxApi.evalByServerCall(pxCtx, (action) => {
            if (action === pxConfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT) {
                pxLogger.error('perimeterx score evaluation failed. unexpected error. passing traffic');
                return callback(pxConfig.SCORE_EVALUATE_ACTION.S2S_PASS_TRAFFIC);
            }

            if (action === pxConfig.SCORE_EVALUATE_ACTION.GOOD_SCORE) {
                return callback(pxConfig.SCORE_EVALUATE_ACTION.S2S_PASS_TRAFFIC);
            }

            if (action === pxConfig.SCORE_EVALUATE_ACTION.BAD_SCORE) {
                return callback(pxConfig.SCORE_EVALUATE_ACTION.S2S_BLOCK_TRAFFIC);
            }

            if(action == pxConfig.SCORE_EVALUATE_ACTION.S2S_TIMEOUT_PASS) {
                return callback(pxConfig.SCORE_EVALUATE_ACTION.S2S_TIMEOUT_PASS);
            }
        });
    } catch (e) {
        pxLogger.error('perimeterx score evaluation failed. unexpected error. ' + e.message);
        return callback(pxConfig.SCORE_EVALUATE_ACTION.S2S_PASS_TRAFFIC);
    }
}


/**
 * formatHeaders - Build request headers in the server2server format.
 *
 * @param {Object} headers - request headers in key value format.
 * @return {Array} request headers an array format.
 */
function formatHeaders(headers) {
    const pxConfig = require('../pxconfig').conf;
    const retval = [];
    try {
        if (!headers || typeof headers !== 'object' || Object.keys(headers).length === 0) {
            return retval;
        }

        for (let header in headers) {
            if (header && headers[header] && pxConfig.SENSITIVE_HEADERS.indexOf(header) === -1) {
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

/**
 * filterSensitiveHeaders - filter headers before sending to perimeterx servers according to user definition.
 * @param {object} headers - the headers object
 *
 * @return {object} filtered headers.
 */
function filterSensitiveHeaders(headers) {
    try {
        const pxConfig = require('../pxconfig').conf;
        const retval = {};

        const sensitiveKeys = pxConfig.SENSITIVE_HEADERS;
        for (let key in headers) {
            if (sensitiveKeys.indexOf(key) === -1) {
                retval[key] = headers[key];
            }
        }
        return retval;
    } catch(e) {
        return headers;
    }
}

function verifyDefined(...values) {
    return values.every(value => value !== undefined && value !== null);
}
