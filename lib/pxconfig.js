'use strict';

let PX_DEFAULT = {};
/* internal configurations */
PX_DEFAULT.SERVER_TO_SERVER_API_URL = '';
PX_DEFAULT.CE_KEYLEN = 32;
PX_DEFAULT.CE_IVLEN = 16;
PX_DEFAULT.CE_DIGEST = 'sha256';
PX_DEFAULT.CE_ALGO = 'aes-256-cbc';

/* to be defined by the initiating user */
PX_DEFAULT.COOKIE_ENCRYPTION = true;
PX_DEFAULT.BLOCKING_SCORE = 70;
PX_DEFAULT.COOKIE_SECRET_KEY = 'password';

module.exports = PX_DEFAULT;
