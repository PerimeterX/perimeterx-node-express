'use strict';
const crypto = require('crypto');
const pxUtil = require('./pxutil');
const pxHttpc = require('./pxhttpc');

exports.verifyCaptcha = verifyCaptcha;

/**
 * verifyUserScore - Verify function, evaluate ca.
 *
 * @param {Object} pxCtx - captcha value.
 * @param {string} pxCaptcha - captcha value.
 * @param {Function} callback - callback function.
 */
function verifyCaptcha(pxCtx, pxCaptcha, callback) {
    const pxConfig = require('../pxconfig').conf;
    if (!pxCaptcha || typeof pxCaptcha !== 'string') {
        return callback('perimeterx captcha is missing');
    }
    const [captcha, vid, uuid] = pxCaptcha.split(':');
    const data = {
        request: {
            ip: pxCtx.ip,
            headers: pxUtil.formatHeaders(pxCtx.headers),
            uri: pxCtx.uri
        },
        pxCaptcha: captcha,
        hostname: pxCtx.hostname
    };

    if (vid) {
        data.vid = vid;
        pxCtx.vid = vid;
    }

    if(uuid) {
        data.uuid = uuid;
        pxCtx.uuid = uuid;
    }

    const headers = {
        Authorization: 'Bearer ' + pxConfig.AUTH_TOKEN,
        'Content-Type': 'application/json'
    };

    const startRiskRtt = Date.now();
    pxHttpc.callServer(data, headers, pxConfig.SERVER_CAPTCHA_URI, 'query', (err, res) => {
        pxCtx.riskRtt = Date.now() - startRiskRtt;
        if (err) {
            return callback(err, res);
        }
        return callback(null, res);
    });
}


