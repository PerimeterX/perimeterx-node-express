'use strict';

const pxCookie = require('./utils/pxcookie');
const pxClient = require('./utils/pxclient');
const pxApi = require('./utils/pxapi');
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
 */
function initPXModule(params) {
    require('./pxconfig').init(params);
}

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
    const pxconfig = require('./pxconfig').conf();
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

function pxMiddleware(req, res, next) {
    const pxconfig = require('./pxconfig').conf();

    try {
        const pxCtx = {};
        pxCtx._px = req.cookies ? req.cookies['_px'] : '';
        pxCtx.ip = req.get(pxconfig.IP_HEADER) || req.px_user_ip || req.ip;
        pxCtx.headers = req.headers;
        pxCtx.uri = req.originalUrl || '/';
        verifyUserScore(pxCtx, (action) => {
            pxlogger.debug('score action ' + action);
            if (action === pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC) {
                return next();
            }

            pxBlock(res, pxCtx, action);
        });
    } catch (e) {
        return next();
    }
}

function pxBlock(res, pxCtx, action) {
    const pxconfig = require('./pxconfig').conf();
    let reason = ``;
    if (action === pxconfig.SCORE_EVALUATE_ACTION.COOKIE_BLOCK_TRAFFIC) {
        reason = 'cookie_high_score';
    } else {
        reason = 's2s_high_score';
    }
    pxClient.sendToPerimeterX('block', {block_reason: reason, block_uuid: pxCtx.block_uuid}, pxCtx);

    res.status(403);
    res.send(pxconfig.BLOCK_HTML);
    //TODO: send activity for block
}