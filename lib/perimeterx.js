'use strict';
/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 0.1 Published 05 April 2016
 */
module.exports.init = initPXModule;



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
    return process;

    function process(req, res, next) {
        return res.send(`Hello From PX ${params.message}`)
    }
}