'use strict';
const request = require('request');
const pxUtil = require('./pxutil');
const pxHttpc = require('./pxhttpc');
const pxLogger = require('./pxlogger');
const pxConfig = require('../pxconfig');

exports.evalByServerCall = evalByServerCall;

/**
 * callServer - call the perimeterx api server to receive a score for a given user.
 *
 * @param {Object} pxCtx - current request context
 * @param {Function} callback - callback function.
 */
function callServer(pxCtx, callback) {
    const config = pxConfig.conf;
    const ip = pxCtx.ip;
    const fullUrl = pxCtx.fullUrl;
    const vid = pxCtx.vid || '';
    const uuid = pxCtx.uuid || '';
    const uri = pxCtx.uri || '/';
    const headers = pxUtil.formatHeaders(pxCtx.headers);
    const httpVersion = pxCtx.httpVersion;

    const data = {
        request: {
            ip: ip,
            headers: headers,
            url: fullUrl,
            uri: uri
        },
        additional: {
            s2s_call_reason: pxCtx.s2sCallReason,
            http_version: httpVersion,
            http_method: pxCtx.httpMethod,
            module_version: config.MODULE_VERSION
        }
    };

    if (pxCtx.s2sCallReason === 'cookie_decryption_failed') {
        data.additional.px_orig_cookie = pxCtx.cookie; //No need strigify, already a string
    }

    if (pxCtx.s2sCallReason === 'cookie_expired' || pxCtx.s2sCallReason === 'cookie_validation_failed') {
        data.additional.px_cookie = JSON.stringify(pxCtx.decodedCookie);
    }

    const reqHeaders = {
        Authorization: 'Bearer ' + config.AUTH_TOKEN,
        'Content-Type': 'application/json'
    };

    if (vid) {
        data.vid = vid;
    }
    if (uuid) {
        data.uuid = uuid;
    }
    pxCtx.hasMadeServerCall = true;
    return pxHttpc.callServer(data, reqHeaders, config.SERVER_TO_SERVER_API_URI, 'query', callback);
}


/**
 * evalByServerCall - main server to server function, execute a server call for score and process its value to make blocking decisions.
 * '
 * @param {Object} pxCtx - current request context.
 * @param {Function} callback - callback function.
 */
function evalByServerCall(pxCtx, callback) {
    const config = pxConfig.conf;
    if (!pxCtx.ip || !pxCtx.headers) {
        pxLogger.error('perimeterx score evaluation failed. bad parameters.');
        return callback(config.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
    }
    callServer(pxCtx, (err, res) => {
        if (err) {
            if (err === 'timeout') {
              pxCtx.passReason = config.PASS_REASON.S2S_TIMEOUT;
              pxLogger.info(`perimeter risk api score did not reach in defined timeout. passing traffic`);
                return callback(config.SCORE_EVALUATE_ACTION.S2S_TIMEOUT_PASS);
            }
            pxLogger.error(err);
            return callback(config.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
        }
        let action = isBadRiskScore(res, pxCtx);
        /* score response invalid - pass traffic */
        if (action === -1) {
            pxLogger.error('perimeterx server query response is invalid');
            return callback(config.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
        }

        /* score did not cross threshold - pass traffic */
        if (action === 1) {
            return callback(config.SCORE_EVALUATE_ACTION.GOOD_SCORE);
        }

        /* score crossed threshold - block traffic */
        if (action === 0) {
            pxCtx.uuid = res.uuid || '';
            return callback(config.SCORE_EVALUATE_ACTION.BAD_SCORE);
        }

        /* This shouldn't be called - if it did - we pass the traffic */
        return callback(config.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
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
    if (!res || !pxUtil.verifyDefined(res.score) || !res.action) {
        return -1;
    }
    let score = res.score;
    if (score >= pxConfig.conf.BLOCKING_SCORE) {
        pxCtx.score = score;
        pxCtx.blockAction = res.action;
        pxCtx.uuid = res.uuid;
        if (res.action === 'j' && res.action_data && res.action_data.body) {
            pxCtx.blockActionData = res.action_data.body;
        }
        return 0;
    } else {
        pxCtx.passReaon =  pxConfig.conf.PASS_REASON.S2S;
        return 1;
    }
}
