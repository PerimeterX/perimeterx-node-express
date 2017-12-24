'use strict';
const MODULE_VERSION = 'NodeJS Module v3.0.1';
const PxExpressClient = require('./pxclient');
const PxEnforcer = require('perimeterx-node-core').PxEnforcer;
let enforcer;
/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 1.0 Published 12 May 2016
 */
module.exports.init = initPXModule;
module.exports.middleware = pxMiddleware;
module.exports.enforcer = () => {return enforcer};

/**
 * initPXModule - Initialize PerimeterX middleware.
 *
 * @param {object} params - Configurations object to extend and overwrite the default settings.
 *
 */
function initPXModule(params) {
    params.moduleVersion = MODULE_VERSION;
    let pxClient = new PxExpressClient();
    enforcer = new PxEnforcer(params, pxClient);
    if (enforcer.config.conf.DYNAMIC_CONFIGURATIONS) {
        setInterval(enforcer.config.confManager.loadData.bind(enforcer.config.confManager), enforcer.config.conf.CONFIGURATION_LOAD_INTERVAL);
    }
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
            res.setHeader(response.header.key, response.header.value);
            res.send(response.body);
        } else { //pass
            next();
        }
    });
}
