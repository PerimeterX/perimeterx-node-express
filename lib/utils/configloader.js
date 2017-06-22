const request = require('request');
const logger = require('./pxlogger');

class ConfigLoader {

    constructor(config) {
        this.config = config;
    }

    init() {
        this.loadData();
        setInterval(this.loadData.bind(this), this.config.CONFIGURATION_LOAD_INTERVAL);
    }

    loadData() {
        const checksum = this.config.checksum;
        const url = this.config.configurationServer + (checksum ? `?checksum=${checksum}` : '');
        const callData = {
            url,
            headers: {Authorization: 'Bearer ' + this.config.AUTH_TOKEN},
            proxy: this.config.PROXY_URL
        };
        logger.debug("Fetching configuration");
        request.get(callData, (error, response, body) => {
            if (error || !response) {
                logger.error(`Failed to make HTTP request: ${error}`)
            }
            if (!(response.statusCode === 200 || response.statusCode === 204)) {
                logger.error(`Non 20x response code: ${response.statusCode}`);
                if (!checksum) { //no configuration loaded and we can't get configuration - disable module
                    this.config.ENABLE_MODULE = false;
                }
            }
            // new configuration available
            if (response.statusCode === 200) {
                logger.debug("Applying new configuration");
                logger.debug(body);
                body = JSON.parse(body);
                this.config.checksum = body.checksum;
                this.config.COOKIE_SECRET_KEY = body.cookieKey;
                this.config.PX_APP_ID = body.appId;
                this.config.BLOCKING_SCORE = body.blockingScore;
                this.config.DEBUG_MODE = body.debugMode;
                this.config.ENABLE_MODULE = body.moduleEnabled;
                this.config.SENSITIVE_HEADERS = body.sensitiveHeaders;
                this.config.ACTIVITIES_TIMEOUT = body.connectTimeout;
                this.config.API_TIMEOUT_MS = body.riskTimeout;
                this.config.blockPageTemplate = body.blockPageTemplate;
                this.config.captchaPageTemplate = body.captchaPageTemplate;
            }
        });
    }
}

module.exports = ConfigLoader;