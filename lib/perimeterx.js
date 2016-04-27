'use strict';

const pxCookie = require('./utils/pxcookie');
const pxApi = require('./utils/pxapi');
const pxconfig = require('./pxconfig');
const pxutil = require('./utils/pxutil');
const pxlogger = require('./utils/pxlogger');

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
    try {
        if (!ip || !headers || !uri) {
            pxlogger.error('perimeterx score evaluation failed. bad parameters.');
            return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
        }
        const userAgent = headers['user-agent'] || headers['User-Agent'] || 'none';

        let action = pxCookie.evalCookie(cookie, ip, userAgent);
        /* score did not cross threshold - pass traffic */
        if (action === pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE) {
            return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
        }

        /* score crossed threshold - block traffic */
        if (action === pxconfig.SCORE_EVALUATE_ACTION.BAD_SCORE) {
            // TODO: send block activity
            return callback(pxconfig.SCORE_EVALUATE_ACTION.COOKIE_BLOCK_TRAFFIC);
        }
        /* when no fallback to s2s call if cookie does not exist or failed on evaluation */
        pxApi.evalByServerCall(ip, pxutil.formatHeaders(headers), uri, action, (action) => {
            if (action === pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE) {
                return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
            }

            if (action === pxconfig.SCORE_EVALUATE_ACTION.BAD_SCORE) {
                // TODO: send block activity
                return callback(pxconfig.SCORE_EVALUATE_ACTION.S2S_BLOCK_TRAFFIC);
            }
        });
    } catch (e) {
        pxlogger.error('perimeterx score evaluation failed. unexpected error. ' + e.message);
        return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
    }
}

function pxMiddleware(req, res, next) {
    try {
        const _px = req.cookies ? req.cookies['_px'] : '';
        const ip = req.get(pxconfig.IP_HEADER) || req.px_user_ip || req.ip;
        const headers = req.headers;
        const uri = req.originalUrl || '/';
        verifyUserScore(_px, ip, headers, uri, (action) => {
            pxlogger.debug('score action ' + action);
            if (action === pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC) {
                return next();
            }

            pxBlock(res, ip, headers, action);
        });
    } catch (e) {
        return next();
    }
}

function pxBlock(res, ip, headers, action) {
    let cause = ``;
    if (action === pxconfig.SCORE_EVALUATE_ACTION.COOKIE_BLOCK_TRAFFIC) {
        cause = 'cookie_high_score';
    } else {
        cause = 's2s_high_score';
    }

    res.status(403);
    res.send(pxconfig.BLOCK_HTML);
    //TODO: send activity for block
}