'use strict';

const pxCookie = require('./utils/pxcookie');
const pxApi = require('./utils/pxapi');
const pxconfig = require('./pxconfig');

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 0.1 Published 05 April 2016
 */
module.exports.init = initPXModule;
module.exports.verify = verifyUserScore;
module.exports.middleware = pxMiddleware;

/**
 * Initialize PerimeterX middleware.
 *
 * @method
 *
 * @param {object} params - Configurations object to extend and overwrite the default settings.
 *
 * @return {Function} An express middleware.
 */
function initPXModule(params) {

}

/**
 * verifyUserScore - Verify function, evaluate score by cookie and s2s and make the return an action.
 *
 * @param {string} cookie - user's px cookie.
 * @param {string} ip - user's ip address.
 * @param {Array} headers - array of user's request headers in a name value format. (example: [{name: 'User-Agent', value: 'PhantomJS'}]
 * @param {string} uri - current request uri
 * @param {Function} callback - callback function.
 */
function verifyUserScore(cookie, ip, headers, uri, callback) {
    if (!ip || !headers || !uri) {
        console.warn(new Error('Error: perimeterx score evaluation failed. bad parameters.').stack);
        return callback(pxconfig.PASS_TRAFFIC);
    }

    const userAgent = headers['user-agent'] || headers['User-Agent'] || 'none';
    let action = pxCookie.evalCookie(cookie, ip, userAgent);
    /* score did not cross threshold - pass traffic */
    if (action === 1) {
        return callback(pxconfig.BLOCK_TRAFFIC);
    }

    /* score crossed threshold - block traffic */
    if (action === 0) {
        return callback(pxconfig.BLOCK_TRAFFIC);
    }

    /* when no fallback to s2s call if cookie does not exist or failed on evaluation */
    return pxApi.evalByServerCall(ip, headers, uri, callback)
}

function pxMiddleware() {

}