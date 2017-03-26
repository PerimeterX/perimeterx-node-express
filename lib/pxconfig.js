'use strict';
const _ = require('lodash');

let PX_DEFAULT = {};
let PX_INTERNAL = {};
let PX_CONF = {};

exports.init = init;
exports.conf = conf;

PX_INTERNAL.MODULE_VERSION= 'NodeJS Module v1.7.0';
/* internal configurations */
PX_INTERNAL.SERVER_HOST = 'https://sapi.perimeterx.net';
PX_INTERNAL.SERVER_TO_SERVER_API_URI = '/api/v1/risk';
PX_INTERNAL.SERVER_CAPTCHA_URI = '/api/v1/risk/captcha';
PX_INTERNAL.SERVER_COLLECT_URI = '/api/v1/collector/s2s';

// Cookie encryption configurations
PX_INTERNAL.COOKIE_ENCRYPTION = true;
PX_INTERNAL.CE_KEYLEN = 32;
PX_INTERNAL.CE_IVLEN = 16;
PX_INTERNAL.CE_ITERATIONS = 1000;
PX_INTERNAL.CE_DIGEST = 'sha256';
PX_INTERNAL.CE_ALGO = 'aes-256-cbc';

PX_INTERNAL.STATIC_FILES_EXT = ['.css', '.bmp', '.tif', '.ttf', '.docx', '.woff2', '.js', '.pict', '.tiff', '.eot', '.xlsx', '.jpg', '.csv', '.eps', '.woff', '.xls', '.jpeg', '.doc', '.ejs', '.otf', '.pptx', '.gif', '.pdf', '.swf', '.svg', '.ps', '.ico', '.pls', '.midi', '.svgz', '.class', '.png', '.ppt', '.mid', 'webp', '.jar']

/* actions */
PX_INTERNAL.SCORE_EVALUATE_ACTION = {
    UNEXPECTED_RESULT: -4,
    NO_COOKIE: -3,
    COOKIE_INVALID: -2,
    COOKIE_EXPIRED: -1,

    S2S_PASS_TRAFFIC: 11,
    COOKIE_PASS_TRAFFIC: 10,
    COOKIE_BLOCK_TRAFFIC: -10,
    S2S_BLOCK_TRAFFIC: -11,
    CAPTCHA_BLOCK_TRAFFIC: -12,

    CAPTCHA_PASS: 0,
    CAPTCHA_BLOCK: 1,

    GOOD_SCORE: 1,
    BAD_SCORE: 0
};

/* to be defined by the initiating user */
PX_DEFAULT.PX_APP_ID = 'PX_APP_ID';
PX_DEFAULT.ENABLE_MODULE = true;
PX_DEFAULT.API_TIMEOUT_MS = 3000;
PX_DEFAULT.BLOCKING_SCORE = 70;
PX_DEFAULT.COOKIE_SECRET_KEY = 'cookie_secret_key';
PX_DEFAULT.AUTH_TOKEN = 'auth_token';
PX_DEFAULT.IP_HEADER = 'px-user-ip';
PX_DEFAULT.BLOCK_HTML = 'BLOCK';
PX_DEFAULT.SENSITIVE_HEADERS = ['cookie', 'cookies'];
PX_DEFAULT.PROXY_URL = '';
PX_DEFAULT.CAPTCHA_ENABLED = true;
PX_DEFAULT.SEND_PAGE_ACTIVITIES = true;
PX_DEFAULT.DEBUG_MODE = false;
PX_DEFAULT.BLOCK_HANDLER = '';
PX_DEFAULT.MAX_BUFFER_LEN = 30;
PX_DEFAULT.GET_USER_IP = '';

function init(params) {
    PX_DEFAULT.ENABLE_MODULE = configurationsOverriding(PX_DEFAULT, params, 'ENABLE_MODULE', 'enableModule');
    PX_DEFAULT.PX_APP_ID = configurationsOverriding(PX_DEFAULT, params, 'PX_APP_ID', 'pxAppId');
    //Set SEVER_HOST if app_id is set.
    PX_INTERNAL.SERVER_HOST = PX_DEFAULT.PX_APP_ID !== 'PX_APP_ID' ? PX_INTERNAL.SERVER_HOST = 'https://sapi-' + PX_DEFAULT.PX_APP_ID.toLowerCase() + '.perimeterx.net' : 'https://sapi.perimeterx.net';
    PX_DEFAULT.COOKIE_SECRET_KEY = configurationsOverriding(PX_DEFAULT, params, 'COOKIE_SECRET_KEY', 'cookieSecretKey');
    PX_DEFAULT.AUTH_TOKEN = configurationsOverriding(PX_DEFAULT, params, 'AUTH_TOKEN', 'authToken');
    PX_DEFAULT.PROXY_URL = configurationsOverriding(PX_DEFAULT, params, 'PROXY_URL', 'proxy');
    PX_DEFAULT.API_TIMEOUT_MS = configurationsOverriding(PX_DEFAULT, params, 'API_TIMEOUT_MS', 'apiTimeoutMS');
    PX_DEFAULT.CAPTCHA_ENABLED = configurationsOverriding(PX_DEFAULT, params, 'CAPTCHA_ENABLED', 'captchaEnabled');
    PX_DEFAULT.BLOCK_HANDLER = configurationsOverriding(PX_DEFAULT, params, 'BLOCK_HANDLER', 'blockHandler');
    PX_DEFAULT.GET_USER_IP = configurationsOverriding(PX_DEFAULT, params, 'GET_USER_IP', 'getUserIp');
    PX_DEFAULT.BLOCKING_SCORE = configurationsOverriding(PX_DEFAULT, params, 'BLOCKING_SCORE', 'blockingScore');
    PX_DEFAULT.IP_HEADER = configurationsOverriding(PX_DEFAULT, params, 'IP_HEADER', 'ipHeader');
    PX_DEFAULT.SEND_PAGE_ACTIVITIES = configurationsOverriding(PX_DEFAULT, params, 'SEND_PAGE_ACTIVITIES', 'sendPageActivities');
    PX_DEFAULT.SENSITIVE_HEADERS = configurationsOverriding(PX_DEFAULT, params, 'SENSITIVE_HEADERS', 'sensitiveHeaders');
    PX_DEFAULT.DEBUG_MODE = configurationsOverriding(PX_DEFAULT, params, 'DEBUG_MODE', 'debugMode');
    PX_DEFAULT.MAX_BUFFER_LEN = configurationsOverriding(PX_DEFAULT, params, 'MAX_BUFFER_LEN', 'maxBufferLength');
    PX_CONF = _.merge(PX_DEFAULT, PX_INTERNAL);
}

function configurationsOverriding(conf, params, defaultName, userInput) {
    /* user did not override configuration */
    if ( !(userInput in params) ) {
        return conf[defaultName];
    }

    /* handling block handler overriding */
    if (userInput == 'blockHandler' || userInput == 'getUserIp') {
        if (typeof params[userInput] == 'function') {
            return params[userInput];
        }
        return '';
    }

    /* for type mismatch, we'll use the default */
    if (typeof conf[defaultName] != typeof params[userInput]) {
        return conf[defaultName];
    }

    return params[userInput];
}

function conf() {
    PX_CONF = _.merge(PX_DEFAULT, PX_INTERNAL);
    return PX_CONF;
}
