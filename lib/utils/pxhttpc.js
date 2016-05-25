'use strict';
const request = require('request');
const pxconfig = require('../../lib/pxconfig').conf();
const keepaliveAgent = getHttpAgent();

exports.callServer = callServer;

/**
 * callServer - call the perimeterx servers.
 *
 * @param {Object} data - data object to pass as POST body
 * @param {Object} headers - http request headers
 * @param {string} uri - px servers endpoint uri
 * @param {string} callType - indication for a query or activities sending
 * @param {Function} callback - callback function.
 */
function callServer(data, headers, uri, callType, callback) {
    const callData = {
        url: pxconfig.SERVER_HOST + uri,
        body: JSON.stringify(data),
        headers: headers,
        proxy: pxconfig.PROXY_URL,
        agent: keepaliveAgent
    };

    if (callType === 'query') {
        callData.timeout = pxconfig.API_TIMEOUT_MS
    }

    try {
        request.post(callData, function (err, response, data) {
            if (err) {
                if (err.code === 'ETIMEDOUT') {
                    return callback('timeout');
                } else {
                    return callback('perimeterx server did not return a valid response');
                }
            }
            if (response && response.statusCode == 200) {
                try {
                    if (typeof data == 'object') {
                        return callback(null, data);
                    } else {
                        return callback(null, JSON.parse(data));
                    }
                } catch (e) {
                    return callback('could not parse perimeterx api server response');
                }
            }
            if (data) {
                try {
                    return callback(`perimeterx server query failed. ${JSON.parse(data).message}`);
                } catch (e) {
                }
            }
            return callback('perimeterx server did not return a valid response');
        });
    } catch (e) {
        return callback('error while calling perimeterx servers');
    }
}

function getHttpAgent() {
    let HttpAgent;
    if (['dev', 'test'].indexOf(process.env.NODE_ENV) > -1) {
        HttpAgent = require('agentkeepalive');
    } else {
        HttpAgent = require('agentkeepalive').HttpsAgent;
    }

    return new HttpAgent({
        maxSockets: 100,
        maxFreeSockets: 10,
        timeout: pxconfig.API_TIMEOUT_MS,
        keepAliveTimeout: 30000
    });
}