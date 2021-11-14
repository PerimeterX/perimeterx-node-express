const cookieParser = require('cookie-parser');
const { PxEnforcer } = require('perimeterx-node-core');

const PxExpressClient = require('./pxclient');
const PxCdEnforcer = require('./pxcdenforcer');

const MODULE_VERSION = 'NodeJS Module v7.0.2';
const MILLISECONDS_IN_MINUTE = 60000;

function parseCookies(req, res) {
    return new Promise((resolve) => {
        if (!req.cookies) {
            cookieParser()(req, res, () => {
                resolve();
            });
        } else {
            resolve();
        }
    });
}

class PerimeterXEnforcer {
    /**
     * @param {object} params - Configurations object to extend and overwrite the default settings
     */
    constructor(params) {
        params.px_module_version = MODULE_VERSION;
        const pxClient = new PxExpressClient();
        this.enforcer = new PxEnforcer(params, pxClient);
        if (params['px_csp_enabled']) {
            this.cdEnforcer = new PxCdEnforcer(params); //if configuration include CSP create
        }

        if (this.enforcer.config.conf.DYNAMIC_CONFIGURATIONS) {
            setInterval(
                this.enforcer.config.confManager.loadData.bind(this.enforcer.config.confManager),
                this.enforcer.config.conf.CONFIGURATION_LOAD_INTERVAL
            );
        }

        this.middleware = this.newMiddleware();
        this.cdMiddleware = this.newCdMiddleware();
    }

    newMiddleware() {
        const enforcer = this.enforcer;
        /**
         * pxMiddleware - middleware wrapper to score verification.
         *
         * @param {Object} req - HTTP Request.
         * @param {Object} res - HTTP Response.
         * @param {Function} next - callback function.
         */
        function pxMiddleware(req, res, next) {
            parseCookies(req, res).then(() => {
                enforcer.enforce(req, res, (err, response) => {
                    if (!err && response) {
                        //block
                        res.status(response.status);
                        if (response.header) {
                            res.setHeader(response.header.key, response.header.value);
                        }

                        if (response.headers) {
                            for (const header in response.headers) {
                                if (Object.prototype.hasOwnProperty.call(response.headers, header)) {
                                    res.setHeader(header, response.headers[header]);
                                }
                            }
                        }
                        res.send(response.body);
                    } else {
                        //pass
                        next();
                    }
                });
            });
        }

        return pxMiddleware;
    }

    newCdMiddleware() {
        const enforcer = this.cdEnforcer;
        /**
         * pxCdMiddleware
         *
         * @param {Object} req - HTTP Request.
         * @param {Object} res - HTTP Response.
         * @param {Function} next - callback function.
         */
        function cdMiddleware(req, res, next) {
            parseCookies(req, res).then(() => {
                if (enforcer) {
                    const policyTimestamp = parseInt(enforcer.cspData['timestamp']);
                    if (policyTimestamp && Date.now() < policyTimestamp + (enforcer.maxInterval * MILLISECONDS_IN_MINUTE)) {
                        enforcer.enforce(enforcer.cspData, req, res);
                    }
                }
                next();
            });
        }

        return cdMiddleware;
    }
}

module.exports = PerimeterXEnforcer;
