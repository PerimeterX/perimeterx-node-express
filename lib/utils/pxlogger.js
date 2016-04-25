/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 0.1 Published 05 April 2016
 */

const pxconfig = require('../pxconfig');

exports.debug = debug;
exports.info = info;
exports.error = error;


function debug(msg) {
    if (pxconfig.DEBUG_MODE && msg) {
        console.info('PX DEBUG:', msg);
    }
}

function info(msg) {
    console.info('PX INFO:', msg);
}

function error(msg) {
    if (typeof msg == 'string') {
        console.error(new Error('PX ERROR: ' + msg).stack);
    }
}

