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
    const captchaParts = pxCaptcha.split(':');
    const data = {
        request: {
            ip: pxCtx.ip,
            headers: pxutil.formatHeaders(pxCtx.headers),
            uri: pxCtx.uri
        },
        pxCaptcha: captchaParts[0],
        hostname: pxCtx.hostname
    };

    if (captchaParts[1] && captchaParts[1] !== 'undefined') {
        data.vid = captchaParts[1];
        pxCtx.px_vid = captchaParts[1];
    }

    if(captchaParts[2] && captchaParts[2] !== 'undefined') {
        data.uuid = captchaParts[2];
        pxCtx.uuid = captchaParts[2];
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


