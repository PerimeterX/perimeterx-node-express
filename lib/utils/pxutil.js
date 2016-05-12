'use strict';

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 1.0 Published 12 May 2016
 */
exports.formatHeaders = formatHeaders;
exports.checkForStatic = checkForStatic;
exports.configurationsOverriding = configurationsOverriding;

/**
 * formatHeaders - Build request headers in the server2server format.
 *
 * @param {Object} headers - request headers in key value format.
 * @return {Array} request headers an array format.
 */
function formatHeaders(headers) {
    const retval = [];
    try {
        if (!headers || typeof headers !== 'object' || Object.keys(headers).length === 0) {
            return retval;
        }

        for (let header in headers) {
            if (header && headers[header]) {
                retval.push({name: header, value: headers[header]});
            }
        }
        return retval;
    } catch (e) {
        return retval;
    }
}


function configurationsOverriding(conf, params, defaultName, userInput) {
    /* user did not override configuration */
    if (!params[userInput]) {
        return conf[defaultName];
    }

    /* for type mismatch, we'll use the default */
    if (typeof conf[defaultName] != typeof params[userInput]) {
        return conf[defaultName];
    }

    /* handling block handler overriding */
    if (userInput == 'blockHandler' && params[userInput]) {
        if (typeof params[userInput] == 'function') {
            return params[userInput];
        }
        return '';
    }

    return params[userInput];
}

/**
 * checkForStatic - check if the request destination is a static file.
 * @param {object} req - the request object
 * @param {Array} exts - list of static file extensions
 *
 * @return {Boolean} true if the target is ststic file/false otherwise.
 */
function checkForStatic(req, exts) {
    const path = req.path;

    for (let i=0; i<exts.length; i++) {
        if (path.endsWith(exts[i])){
            return true;
        }
    }

    return false;
}
