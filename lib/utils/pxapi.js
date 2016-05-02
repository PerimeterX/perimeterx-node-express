'use strict';
const client = require('restler');
const pxutil = require('./pxutil');
const pxlogger = require('./pxlogger');
const pxconfig = require('../pxconfig').conf();

exports.evalByServerCall = evalByServerCall;

/**
 * callServer - call the perimeterx api server to receive a score for a given user.
 *
 * @param {string} ip - user's ip address.
 * @param {Array} headers - array of user's request headers in a name value format. (example: [{name: 'User-Agent', value: 'PhantomJS'}]
 * @param {string} uri - current request uri
 * @param {string} cause - server to server call reason, enum value to be resolved from configuration
 * @param {Function} callback - callback function.
 */
function callServer(ip, headers, uri, cause, callback) {
    const callData = {
        data: {
            request: {
                ip: ip,
                headers: headers,
                uri: uri
            },
            additional: {
                s2s_call_reason: causeToString(cause)
            }
        },
        headers: {
            Authorization: 'Bearer ' + pxconfig.AUTH_TOKEN,
            'Content-Type': 'application/json'
        },
        timeout: 1000
    };
    const riskCall = client.post(pxconfig.SERVER_HOST + pxconfig.SERVER_TO_SERVER_API_URI, callData);
    riskCall.on('complete', function (data, response) {
        if (response && response.statusCode == 200) {
            try {
                return callback(null, JSON.parse(data));
            } catch (e) {
                return callback(e.message);
            }
        }

        if (data.message) {
            return callback(`perimeterx server query failed. ${data.message}`);
        }
        return callback(`perimeterx server did not return a valid response`);
    });

    riskCall.on('timeout', function () {
        return callback(`timeout`);
    });
}

/**
 * evalByServerCall - main server to server function, execute a server call for score and process its value to make blocking decisions.
 *
 * @param {Object} pxCtx - current request context.
 *        {string} pxCtx.cookie - user's px cookie.
 *        {string} pxCtx.ip - user's ip address.
 *        {Array} pxCtx.headers - array of user's request headers in a name value format. (example: [{name: 'User-Agent', value: 'PhantomJS'}]
 *        {string} pxCtx.uri - current request uri
 * @param {string} cause - server to server call reason, enum value to be resolved from configurations
 * @param {Function} callback - callback function.
 */
function evalByServerCall(pxCtx, cause, callback) {
    const ip = pxCtx.ip;
    const headers = pxutil.formatHeaders(pxCtx.headers);
    const uri = pxCtx.uri;

    if (!ip || !headers || !uri) {
        pxlogger.error('perimeterx score evaluation failed. bad parameters.');
        return callback(pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
    }
    callServer(ip, headers, uri, cause, (err, res) => {
        if (err) {
            if (err == 'timeout') {
                pxlogger.info(`perimeter risk api score did not reach in defined timeout. passing traffic`);
                return callback(pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE);
            }
            pxlogger.error(err);
            return callback(pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT);
        }
        let action = isBadRiskScore(res);
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
 *
 * @return {Number} indicator to the validity of the cookie.
 *                   -1 response object is not valid
 *                   0 response valid with bad score
 *                   1 response valid with good score
 *
 */
function isBadRiskScore(res) {
    if (!typeof (res) || !res.scores) {
        return -1;
    }
    let score = Math.max(Number(res.scores.non_human), Number(res.scores.suspected_script));
    return score >= pxconfig.BLOCKING_SCORE ? 0 : 1;
}


function causeToString(cause) {
    switch (cause) {
        case pxconfig.SCORE_EVALUATE_ACTION.COOKIE_INVALID:
            return 'cookie_invalid';
        case pxconfig.SCORE_EVALUATE_ACTION.COOKIE_EXPIRED:
            return 'cookie_expired';
        case pxconfig.SCORE_EVALUATE_ACTION.NO_COOKIE:
            return 'no_cookie';
        case pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT:
        default:
            return 'none';

    }

}