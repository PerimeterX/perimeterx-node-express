/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 1.0 Published 12 May 2016
 */

const pxConfig = require('../pxconfig');

exports.debug = debug;
exports.info = info;
exports.error = error;


function debug(msg) {
    if (pxConfig.conf.DEBUG_MODE && msg) {
        console.info('PX DEBUG:', msg);
    }
}

function info(msg) {
    console.info('PX INFO:', msg);
}

function error(msg) {
    if (typeof msg === 'string') {
        console.error(new Error('PX ERROR: ' + msg).stack);
    }
}

