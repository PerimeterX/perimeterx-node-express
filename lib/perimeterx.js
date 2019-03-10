'use strict';

const PerimeterXEnforcer = require('./pxenforcer');
let enforcer = null;
let middleware = null;

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 1.0 Published 12 May 2016
 */
module.exports.init = (params) => {
    const instance = new PerimeterXEnforcer(params);
    enforcer = instance.enforcer;
    middleware = instance.middleware;
};
module.exports.middleware = middleware;
module.exports.enforcer = () => enforcer;

module.exports.new = (params) => new PerimeterXEnforcer(params);