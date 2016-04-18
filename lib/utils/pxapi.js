'use strict';
const client = require('restler');
const pxconfig = require('../pxconfig');

exports.evalByServerCall = evalByServerCall;

/**
 * callServer - call the perimeterx api server to receive a score for a given user.
 *
 * @param {string} ip - user's ip address.
 * @param {Array} headers - array of user's request headers in a name value format. (example: [{name: 'User-Agent', value: 'PhantomJS'}]
 * @param {string} uri - current request uri
 * @param {Function} callback - callback function.
 */
function callServer(ip, headers, uri, callback) {
    const riskCall = client.post(pxconfig.SERVER_HOST + pxconfig.SERVER_TO_SERVER_API_URI, {
        data: {
            request: {
                ip: ip,
                headers: headers,
                uri: uri
            }
        },
        headers: {
            Authorization: 'Bearer ' + pxconfig.AUTH_TOKEN,
            'Content-Type': 'application/json'
        },
        timeout: pxconfig.API_TIMEOUT_MS
    });

    riskCall.on('complete', function (data, response) {
        if (response && response.statusCode == 200) {
            try {
                console.log(data);
                
                return callback(null, JSON.parse(data));
            } catch (e) {
                return callback(e.message);
            }
        }

        if (data.message) {
            return callback(`Error: perimeterx server query failed. ${data.message}`);
        }

        return callback('Error: perimeterx server did not return a valid response');
    });

    riskCall.on('timeout', function () {
        return callback('Error: perimeterx server query timeout');
    });
}

/**
 * evalByServerCall - main server to server function, execute a server call for score and process its value to make blocking decisions.
 *
 * @param {string} ip - user's ip address.
 * @param {Array} headers - array of user's request headers in a name value format. (example: [{name: 'User-Agent', value: 'PhantomJS'}]
 * @param {string} uri - current request uri
 * @param {Function} callback - callback function.
 */
function evalByServerCall(ip, headers, uri, callback) {
    callServer(ip, headers, uri, (err, res) => {
        if (err) {
            console.warn(new Error(err).stack);
            return callback(pxconfig.PASS_TRAFFIC);
        }

        let action = processScore(res);
        /* score response invalid - pass traffic */
        if (action === -1) {
            console.warn(new Error('Error: perimeterx server query response is invalid').stack);
            return callback(pxconfig.PASS_TRAFFIC);
        }

        /* score did not cross threshold - pass traffic */
        if (action === 1) {
            return callback(pxconfig.BLOCK_TRAFFIC);
        }

        /* score crossed threshold - block traffic */
        if (action === 0) {
            return callback(pxconfig.BLOCK_TRAFFIC);
        }

        /* This shouldn't be called - if it did - we pass the traffic */
        return callback(pxconfig.PASS_TRAFFIC);
    });
}

/**
 * processScore - processing response score and return a block indicator.
 *
 * @param {object} res - perimeterx response object.
 *
 * @return {Number} indicator to the validity of the cookie.
 *                   -1 response object is not valid
 *                   0 response valid with bad score
 *                   1 response valid with good score
 *
 */
function processScore(res) {
    if (!typeof (res) || !res.scores) {
        return -1;
    }
    let score = Math.max(Number(res.scores.non_human), Number(res.scores.suspected_script));
    return score >= pxconfig.BLOCKING_SCORE ? 0 : 1;
}


