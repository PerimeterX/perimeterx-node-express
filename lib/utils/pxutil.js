'use strict';

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 0.1 Published 05 April 2016
 */
exports.formatHeaders = formatHeaders;

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