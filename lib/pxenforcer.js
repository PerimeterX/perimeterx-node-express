const cookieParser = require('cookie-parser');
const { PxEnforcer, PxCdFirstParty } = require('perimeterx-node-core');

const PxExpressClient = require('./pxclient');
const PxCdEnforcer = require('./pxcdenforcer');

const MODULE_VERSION = 'NodeJS Module v7.1.1';
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
        this.cdFirstParty = new PxCdFirstParty(params, pxClient);
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

        function saveResponseBody(res) {
            const bodyChunks = [];

            const responseWrite = res.write;
            res.write = (...args) => {
                bodyChunks.push(Buffer.from(args[0]));
                responseWrite.apply(res, args);
            };

            const responseEnd = res.end;
            res.end = (...args) => {
                if (args[0]) {
                    bodyChunks.push(Buffer.from(args[0]));
                }
                res.locals = {
                    ...res.locals,
                    body: Buffer.concat(bodyChunks).toString('utf8')
                };

                responseEnd.apply(res, args);
            };
        }

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
                        PerimeterXEnforcer.handleCallbackResponse(err, response, res);
                    } else {
                        //pass
                        saveResponseBody(res);
                        res.on('finish', () => {
                            if (!req || !req.locals || !req.locals.pxCtx) {
                                return;
                            }

                            const { AUTOMATIC_ADDITIONAL_S2S_ACTIVITY_ENABLED } = enforcer.config.conf;
                            const { pxCtx } = req.locals;
                            if (AUTOMATIC_ADDITIONAL_S2S_ACTIVITY_ENABLED && pxCtx.additionalFields.loginCredentials) {
                                enforcer.handleAdditionalS2SActivity(pxCtx, res);
                            }
                        });
                        next();
                    }
                });
            });
        }

        return pxMiddleware;
    }

    newCdMiddleware() {
        const enforcer = this.cdEnforcer;
        const cdFirstParty = this.cdFirstParty;
        /**
         * pxCdMiddleware
         *
         * @param {Object} req - HTTP Request.
         * @param {Object} res - HTTP Response.
         * @param {Function} next - callback function.
         */
        function cdMiddleware(req, res, next) {
            parseCookies(req, res).then(() => {
                cdFirstParty.handleFirstPartyRequest(req, res, (err, response) => {
                    if (!err && response) {
                        PerimeterXEnforcer.handleCallbackResponse(err, response, res);
                    } else {
                        if (enforcer) {
                            const policyTimestamp = parseInt(enforcer.cspData['timestamp']);
                            if (policyTimestamp && Date.now() < policyTimestamp + (enforcer.maxInterval * MILLISECONDS_IN_MINUTE)) {
                                enforcer.enforce(enforcer.cspData, req, res);
                            }
                        }
                        next();
                    }
                });
            });
        }

        return cdMiddleware;
    }

    static handleCallbackResponse(err, response, res) {
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
    }

    /**
     * sendAdditionalS2SActivity -  API function to send additional_s2s activity to PerimeterX
     *
     * @param {Object} req - HTTP request
     * @param {number} responseStatusCode - HTTP response status code
     * @param {boolean} isLoginSuccessful - if login was successful
     */
    sendAdditionalS2SActivity(req, responseStatusCode, isLoginSuccessful) {
        if (!req || !req.locals || !req.locals.pxCtx) {
            return;
        }

        this.enforcer.sendAdditionalS2SActivity(req.locals.pxCtx, responseStatusCode, isLoginSuccessful);
    }
}

module.exports = PerimeterXEnforcer;
