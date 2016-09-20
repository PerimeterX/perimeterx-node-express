'use strict';
const request = require('request');
const pxutil = require('./pxutil');
const pxhttpc = require('./pxhttpc');
const pxlogger = require('./pxlogger');
const pxconfig = require('../pxconfig').conf();

exports.evalByServerCall = evalByServerCall;

/**
 * callServer - call the perimeterx api server to receive a score for a given user.
 *
 * @param {Object} pxCtx - current request context
 * @param {Function} callback - callback function.
 */
function callServer(pxCtx, callback) {
    const ip = pxCtx.ip;
    const full_url = pxCtx.full_url;
    const vid = pxCtx.px_vid || '';
    const uri = pxCtx.uri || '/';
    const headers = pxutil.formatHeaders(pxCtx.headers);
    const http_version = pxCtx.http_version;

    const data = {
        request: {
            ip: ip,
            headers: headers,
            url: full_url,
            uri: uri
        },
        additional: {
            s2s_call_reason: pxCtx.s2s_call_reason,
            http_version: http_version,
            http_method: pxCtx.http_method,
            module_version: pxconfig.MODULE_VERSION
        }
    };
    if (pxCtx.s2s_call_reason == 'cookie_expired' || pxCtx.s2s_call_reason == 'cookie_verification_failed') {
        data.additional.px_cookie = JSON.stringify(pxCtx.decrypted_px_cookie);
    }

    const reqHeaders = {
        Authorization: 'Bearer ' + pxconfig.AUTH_TOKEN,
        'Content-Type': 'application/json'
    };

    if (vid) {
        data.vid = vid;
    }

    return pxhttpc.callServer(data, reqHeaders, pxconfig.SERVER_TO_SERVER_API_URI, 'query', callback);
}


/**
 * evalByServerCall - main server to server function, execute a server call for score and process its value to make blocking decisions.
 * '
 * @param {Object} pxCtx - current request context.
 * @param {Function} callback - callback function.
 */
function evalByServerCall(pxCtx, callback) {
    if (!pxCtx.ip || !pxCtx.headers) {
        pxlogger.error('perimeterx score evaluation failed. bad parameters.');
        return callback(pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
    }
    callServer(pxCtx, (err, res) => {
        if (err) {
            if (err === 'timeout') {
                pxlogger.info(`perimeter risk api score did not reach in defined timeout. passing traffic`);
                return callback(pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE);
            }
            pxlogger.error(err);
            return callback(pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
        }
        let action = isBadRiskScore(res, pxCtx);
        /* score response invalid - pass traffic */
        if (action === -1) {
            pxlogger.error('perimeterx server query response is invalid');
            return callback(pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
        }

        /* score did not cross threshold - pass traffic */
        if (action === 1) {
            return callback(pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE);
        }

        /* score crossed threshold - block traffic */
        if (action === 0) {
            pxCtx.block_uuid = res.uuid || '';
            return callback(pxconfig.SCORE_EVALUATE_ACTION.BAD_SCORE);
        }

        /* This shouldn't be called - if it did - we pass the traffic */
        return callback(pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
    });
}

/**
 * isBadRiskScore - processing response score and return a block indicator.
 *
 * @param {object} res - perimeterx response object.
 * @param {object} pxCtx - current request context.
 *
 * @return {Number} indicator to the validity of the cookie.
 *                   -1 response object is not valid
 *                   0 response valid with bad score
 *                   1 response valid with good score
 *
 */
function isBadRiskScore(res, pxCtx) {
    if (!typeof (res) || !res.scores) {
        return -1;
    }
    let score = Math.max(Number(res.scores.non_human), Number(res.scores.suspected_script));
    if (score >= pxconfig.BLOCKING_SCORE) {
        pxCtx.block_score = score;
        return 0;
    } else {
        return 1;
    }
}
