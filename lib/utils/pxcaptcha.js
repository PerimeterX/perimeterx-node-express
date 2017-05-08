'use strict';
const crypto = require('crypto');
const pxconfig = require('../pxconfig').conf();
const pxlogger = require('./pxlogger');
const pxutil = require('./pxutil');
const pxhttpc = require('./pxhttpc');

exports.verifyCaptcha = verifyCaptcha;

/**
 * verifyUserScore - Verify function, evaluate ca.
 *
 * @param {Object} pxCtx - captcha value.
 * @param {string} pxCaptcha - captcha value.
 * @param {Function} callback - callback function.
 */
function verifyCaptcha(pxCtx, pxCaptcha, callback) {
    const pxconfig = require('../pxconfig').conf();
    if (!pxCaptcha || typeof pxCaptcha !== 'string') {
        return callback('perimeterx captcha is missing');
    }
    const [captcha, vid, uuid] = pxCaptcha.split(':');
    const data = {
        request: {
            ip: pxCtx.ip,
            headers: pxutil.formatHeaders(pxCtx.headers),
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
        Authorization: 'Bearer ' + pxconfig.AUTH_TOKEN,
        'Content-Type': 'application/json'
    };

    pxhttpc.callServer(data, headers, pxconfig.SERVER_CAPTCHA_URI, 'query', (err, res) => {
        if (err) {
            return callback(err, res);
        }
        return callback(null, res);
    });
}


