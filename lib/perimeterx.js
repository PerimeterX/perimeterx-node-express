'use strict';

const PerimeterXEnforcer = require('./pxenforcer');
const { addNonce } = require('perimeterx-node-core');
let enforcer = null;

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 1.0 Published 12 May 2016
 */
module.exports.init = (params) => {
    const instance = new PerimeterXEnforcer(params);
    enforcer = instance.enforcer;
    module.exports.middleware = instance.middleware;
};

module.exports.enforcer = () => enforcer;

module.exports.new = (params) => new PerimeterXEnforcer(params);

module.exports.addNonce = addNonce;