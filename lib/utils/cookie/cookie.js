'use strict';

const pxLogger = require('../pxlogger');
const crypto = require('crypto');

class Cookie {

    constructor() {
        //cookie string
        this._pxCookie = '';

        //decoded cookie string
        this._decodedCookie = '';

        //PerimeterX configuration object
        this._pxConfig = {};

        //PerimeterX context
        this._pxContext = {};

        //cookie secret string
        this._cookieSecret = '';
    }


    get decodedCookie() {
        return this._decodedCookie;
    }

    get cookie() {
        return this._pxCookie;
    }

    get config() {
        return this._pxConfig;
    }

    get time() {
        return this.decodedCookie.t;
    }

    get uuid() {
        return this.decodedCookie.u || '';
    }

    get vid() {
        return this.decodedCookie.v || '';
    }

    /**
     * Checks if the cookie's score is above the configured blocking score
     * @returns {boolean}
     */
    isHighScore() {
        return this.score >= this.config.BLOCKING_SCORE;
    }

    /**
     * Checks if the cookie has expired
     * @returns {boolean}
     */
    isExpired() {
        return this.time < Date.now();
    }

    /**
     * Deserializes an encrypted and/or encoded cookie string.
     *
     * This must be called before using an instance.
     * @returns {boolean}
     */
    deserialize() {
        if (this.decodedCookie) {
            return true;
        }
        let cookie;
        if (this.config.COOKIE_ENCRYPTION) {
            cookie = this.decrypt();
        } else {
            cookie = this.decode();
        }
        if (cookie === '' || !this.isCookieFormatValid(cookie)) {
            return false;
        }

        this._decodedCookie = cookie;
        return true;
    }

    /**
     * Checks that the cookie was deserialized successfully, has not expired, and is secure
     * @returns {boolean}
     */
    isValid() {
        return this.deserialize() && !this.isExpired() && this.isSecure();
    }

    /**
     * Decrypts an encrypted Perimeterx cookie
     * @returns {string}
     */
    decrypt() {
        const data = this.cookie.split(':');
        if (data.length !== 3) {
            pxLogger.debug('invalid cookie format');
            return '';
        }
        const iterations = Number(data[1]);
        const encryptedCookie = data[2];
        /* iterations value is not a number */
        if (!iterations) {
            pxLogger.debug('invalid cookie format');
            return '';
        }

        /* iterations value is not in the legit range */
        if (iterations > 5000 || iterations < 500) {
            pxLogger.debug('invalid cookie format');
            return '';
        }

        /* salt value is not as expected */
        if (!data[0] || typeof data[0] !== 'string' || data[0].length > 100) {
            pxLogger.debug('invalid cookie format');
            return '';
        }

        /* cookie value is not as expected */
        if (!encryptedCookie || typeof encryptedCookie !== 'string') {
            pxLogger.debug('invalid cookie format');
            return '';
        }

        const salt = new Buffer(data[0], 'base64');
        const derivation = crypto.pbkdf2Sync(this._cookieSecret, salt, iterations, this.config.CE_KEYLEN + this.config.CE_IVLEN, this.config.CE_DIGEST);
        const key = derivation.slice(0, this.config.CE_KEYLEN);
        const iv = derivation.slice(this.config.CE_KEYLEN);

        const cipher = crypto.createDecipheriv(this.config.CE_ALGO, key, iv);
        let decrypted = cipher.update(encryptedCookie, 'base64', 'utf8');
        decrypted += cipher.final('utf8');

        return JSON.parse(decrypted);
    }

    /**
     * Decodes an unencrypted (base64) Perimeterx cookie
     */
    decode() {
        const decodedStr = new Buffer(this.cookie, 'base64').toString('utf8');
        return JSON.parse(decodedStr);
    }

    isHmacValid(hmacStr, cookieHmac) {
        try {
            let hmac = crypto.createHmac(this.config.CE_DIGEST, this._cookieSecret);
            hmac.setEncoding('hex');
            hmac.write(hmacStr);
            hmac.end();
            const h = hmac.read();
            return h === cookieHmac;
        } catch (err) {
            pxLogger.error('Error while validating Perimeterx cookie: ' + err.stack)
        }
    }

    /* abstract methods to be implemented by sub classes */

    get score() {}
    get hmac() {}
    get blockAction() {}
    isCookieFormatValid(cookie) {}

    /**
     * Checks that the cookie is secure via HMAC
     * @returns {boolean}
     */
    isSecure() {}


}

module.exports = Cookie;
