'use strict';
const MODULE_VERSION = 'NodeJS Module v3.0.0RC';
const pxClient = require('./pxclient');
const PxEnforcer = require('perimeterx-node-core').PxEnforcer;
let enforcer;
/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 1.0 Published 12 May 2016
 */
module.exports.init = initPXModule;
module.exports.middleware = pxMiddleware;

/**
 * initPXModule - Initialize PerimeterX middleware.
 *
 * @param {object} params - Configurations object to extend and overwrite the default settings.
 *
 */
function initPXModule(params) {
    params.moduleVersion = MODULE_VERSION;
    enforcer = new PxEnforcer(params);
    pxClient.init();
}

/**
 * pxMiddleware - middleware wrapper to score verification.
 *
 * @param {Object} req - HTTP Request.
 * @param {Object} res - HTTP Response.
 * @param {Function} next - callback function.
 */
function pxMiddleware(req, res, next) {
    enforcer.enforce(req, res, (response) => {
        if (response) { //block
            res.status(response.status);
            res.header('Content-Type', 'text/html');
            res.send(response.body);
        } else { //pass
            next();
        }
    });
}
