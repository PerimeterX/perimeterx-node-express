'use strict';

const _ = require('lodash');
const pxutil = require('./utils/pxutil');
let PX_DEFAULT = {};
let PX_INTERNAL = {};
let PX_CONF = {};

module.exports.init = init;
module.exports.conf = conf;

/* internal configurations */
PX_INTERNAL.SERVER_HOST = 'http://localhost:8080';
PX_INTERNAL.SERVER_TO_SERVER_API_URI = '/api/v1/risk';

// Cookie encryption configurations
PX_INTERNAL.CE_KEYLEN = 32;
PX_INTERNAL.CE_IVLEN = 16;
PX_INTERNAL.CE_ITERATIONS = 1000;
PX_INTERNAL.CE_DIGEST = 'sha256';
PX_INTERNAL.CE_ALGO = 'aes-256-cbc';

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
PX_DEFAULT.COOKIE_ENCRYPTION = true;
PX_DEFAULT.BLOCKING_SCORE = 70;
PX_DEFAULT.COOKIE_SECRET_KEY = 'VYMugZj32NYG5jtpC+Nd39o4SuVCjm5y3QWH7+4xtY6Zc7uvG3/kk9TvbGuyKBTj';
PX_DEFAULT.AUTH_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZXMiOlsicmlza19zY29yZSIsInJlc3RfYXBpIl0sImlhdCI6MTQ2MTA3NzM3MSwic3ViIjoiUFgzdEhxNTMyZyIsImp0aSI6IjRiYzU5ZDNiLWVkNGItNGRjOC1hZWI4LTk5N2UyNjhmNDMxZSJ9.sNS72J_XsHkAIxnwwAJmCVjwCmK77mt4QF2yeXJIqUc';
PX_DEFAULT.IP_HEADER = 'px-user-ip';
PX_DEFAULT.BLOCK_HTML = 'BLOCK';
PX_DEFAULT.DEBUG_MODE = true;

function init(params) {
    PX_DEFAULT.API_TIMEOUT_MS = pxutil.configurationsOverriding(PX_DEFAULT, params, 'API_TIMEOUT_MS', 'apiTimeoutMS');
    PX_DEFAULT.PX_APP_ID = pxutil.configurationsOverriding(PX_DEFAULT, params, 'PX_APP_ID', 'pxAppId');
    PX_DEFAULT.COOKIE_SECRET_KEY = pxutil.configurationsOverriding(PX_DEFAULT, params, 'COOKIE_SECRET_KEY', 'cookieSecretKey');
    PX_DEFAULT.AUTH_TOKEN = pxutil.configurationsOverriding(PX_DEFAULT, params, 'AUTH_TOKEN', 'authToken');
    PX_DEFAULT.COOKIE_ENCRYPTION = pxutil.configurationsOverriding(PX_DEFAULT, params, 'COOKIE_ENCRYPTION', 'cookieEncryption');
    PX_DEFAULT.BLOCKING_SCORE = pxutil.configurationsOverriding(PX_DEFAULT, params, 'BLOCKING_SCORE', 'blockingScore');
    PX_DEFAULT.BLOCK_HTML = pxutil.configurationsOverriding(PX_DEFAULT, params, 'BLOCK_HTML', 'blockHtml');
    PX_DEFAULT.IP_HEADER = pxutil.configurationsOverriding(PX_DEFAULT, params, 'IP_HEADER', 'ipHeader');
    PX_DEFAULT.DEBUG_MODE = pxutil.configurationsOverriding(PX_DEFAULT, params, 'DEBUG_MODE', 'debugMode');
    PX_CONF = _.merge(PX_DEFAULT, PX_INTERNAL);
}

function conf() {
    PX_CONF = _.merge(PX_DEFAULT, PX_INTERNAL);
    return PX_CONF;
}
