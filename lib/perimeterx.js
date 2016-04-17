'use strict';

const pxCookie = require('./utils/pxcookie');

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 0.1 Published 05 April 2016
 */
module.exports.init = initPXModule;
module.exports.verify = verifyUserScore;
module.exports.middleware = pxMiddleware;

/**
 * Initialize PerimeterX middleware.
 *
 * @method
 *
 * @param {object} params - Configurations object to extend and overwrite the default settings.
 *
 * @return {Function} An express middleware.
 */
function initPXModule(params) {

}

function verifyUserScore() {

}

function pxMiddleware() {

}