const MODULE_VERSION = 'NodeJS Module v6.2.1';
const PxExpressClient = require('./pxclient');
const PxEnforcer = require('perimeterx-node-core').PxEnforcer;
const cookieParser = require('cookie-parser');

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
        params.moduleVersion = MODULE_VERSION;
        const pxClient = new PxExpressClient();
        this.enforcer = new PxEnforcer(params, pxClient);

        if (this.enforcer.config.conf.DYNAMIC_CONFIGURATIONS) {
            setInterval(
                this.enforcer.config.confManager.loadData.bind(this.enforcer.config.confManager),
                this.enforcer.config.conf.CONFIGURATION_LOAD_INTERVAL
            );
        }

        this.middleware = this.newMiddleware();
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
                    if (!err && response) { //block
                        res.status(response.status);
                        if (response.header) {
                            res.setHeader(response.header.key, response.header.value);
                        }

                        if (response.headers) {
                            for (const header in response.headers) {
                                if (response.headers.hasOwnProperty(header)) {
                                    res.setHeader(header, response.headers[header]);
                                }
                            }
                        }
                        res.send(response.body);
                    } else { //pass
                        next();
                    }
                });
            });
        }

        return pxMiddleware;
    }
}

module.exports = PerimeterXEnforcer;
