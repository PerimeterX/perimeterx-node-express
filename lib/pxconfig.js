'use strict';

const _ = require('lodash');
const pxutil = require('./utils/pxutil');
let PX_DEFAULT = {};
let PX_INTERNAL = {};
let PX_CONF = {};

module.exports.init = init;
module.exports.conf = conf;

/* internal configurations */
PX_INTERNAL.SERVER_HOST = 'http://collector.a.pxi.pub';
PX_INTERNAL.SERVER_TO_SERVER_API_URI = '/api/v1/risk';
PX_INTERNAL.SERVER_COLLECT_URI = '/api/v1/collector/s2s';

// Cookie encryption configurations
PX_INTERNAL.COOKIE_ENCRYPTION = true;
PX_INTERNAL.CE_KEYLEN = 32;
PX_INTERNAL.CE_IVLEN = 16;
PX_INTERNAL.CE_ITERATIONS = 1000;
PX_INTERNAL.CE_DIGEST = 'sha256';
PX_INTERNAL.CE_ALGO = 'aes-256-cbc';

PX_INTERNAL.MAX_BUFFER_LEN = 30;

/* actions */
PX_INTERNAL.SCORE_EVALUATE_ACTION = {
    UNEXPECTED_RESULT: -4,
    NO_COOKIE: -3,
    COOKIE_INVALID: -2,
    COOKIE_EXPIRED: -1,

    PASS_TRAFFIC: 10,
    COOKIE_BLOCK_TRAFFIC: -10,
    S2S_BLOCK_TRAFFIC: -11,

    GOOD_SCORE: 1,
    BAD_SCORE: 0
};

/* to be defined by the initiating user */
PX_DEFAULT.PX_APP_ID = 'PX_APP_ID';
PX_DEFAULT.API_TIMEOUT_MS = 1000;
PX_DEFAULT.BLOCKING_SCORE = 70;
PX_DEFAULT.COOKIE_SECRET_KEY = 'cookie_secret_key';
PX_DEFAULT.AUTH_TOKEN = 'auth_token';
PX_DEFAULT.IP_HEADER = 'px-user-ip';
PX_DEFAULT.BLOCK_HTML = 'BLOCK';
PX_DEFAULT.SEND_PAGE_ACTIVITIES = true;
PX_DEFAULT.DEBUG_MODE = true;
PX_DEFAULT.BLOCK_HANDLER = '';

function init(params) {
    PX_DEFAULT.PX_APP_ID = pxutil.configurationsOverriding(PX_DEFAULT, params, 'PX_APP_ID', 'pxAppId');
    PX_DEFAULT.COOKIE_SECRET_KEY = pxutil.configurationsOverriding(PX_DEFAULT, params, 'COOKIE_SECRET_KEY', 'cookieSecretKey');
    PX_DEFAULT.AUTH_TOKEN = pxutil.configurationsOverriding(PX_DEFAULT, params, 'AUTH_TOKEN', 'authToken');
    PX_DEFAULT.API_TIMEOUT_MS = pxutil.configurationsOverriding(PX_DEFAULT, params, 'API_TIMEOUT_MS', 'apiTimeoutMS');
    PX_DEFAULT.BLOCK_HANDLER = pxutil.configurationsOverriding(PX_DEFAULT, params, 'BLOCK_HANDLER', 'blockHandler');
    PX_DEFAULT.BLOCKING_SCORE = pxutil.configurationsOverriding(PX_DEFAULT, params, 'BLOCKING_SCORE', 'blockingScore');
    PX_DEFAULT.IP_HEADER = pxutil.configurationsOverriding(PX_DEFAULT, params, 'IP_HEADER', 'ipHeader');
    PX_DEFAULT.SEND_PAGE_ACTIVITIES = pxutil.configurationsOverriding(PX_DEFAULT, params, 'SEND_PAGE_ACTIVITIES', 'sendPageActivities');
    PX_DEFAULT.DEBUG_MODE = pxutil.configurationsOverriding(PX_DEFAULT, params, 'DEBUG_MODE', 'debugMode');
    PX_CONF = _.merge(PX_DEFAULT, PX_INTERNAL);
}

function conf() {
    PX_CONF = _.merge(PX_DEFAULT, PX_INTERNAL);
    return PX_CONF;
}
