'use strict';

const CookieV1 = require('./cookieV1');
const CookieV3 = require('./cookieV3');
const pxlogger = require('./pxlogger');
const crypto = require('crypto');

class Cookie {
    //cookie string
    _pxCookie;

    //decoded cookie string
    _decodedCookie;

    //PerimeterX configuration object
    _pxConfig;

    //PerimeterX context
    _pxContext;

    //cookie secret string
    _cookieSecret;

    /**
     * Factory method for creating PX Cookie object according to cookie version found on the request
     */
    static pxCookieFactory(ctx, config) {
        if (ctx.cookies['_px3']) {
            return new CookieV3(ctx, config);
        }
        return new CookieV1(ctx, config);
    }

    get decodedCokie() {
        return this._decodedCookie;
    }

    get cookie() {
        return this._pxCookie;
    }

    get config() {
        return this._pxConfig;
    }

    get time() {
        return this.decodedCokie.t;
    }

    get uuid() {
        return this.decodedCokie.u || '';
    }

    get vid() {
        return this.decodedCokie.v || '';
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
        if (this.decodedCokie) {
            return true;
        }
        let cookie;
        if (this.config.COOKIE_ENCRYPTION) {
            cookie = this.decrypt();
        } else {
            cookie = this.decode();
        }
        if (!cookie.isCookieFormatValid()) {
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
            pxlogger.debug('invalid cookie format');
            return '';
        }
        const iterations = Number(data[1]);
        const encryptedCookie = data[2];
        /* iterations value is not a number */
        if (!iterations) {
            pxlogger.debug('invalid cookie format');
            return '';
        }

        /* iterations value is not in the legit range */
        if (iterations > 5000 || iterations < 500) {
            pxlogger.debug('invalid cookie format');
            return '';
        }

        /* salt value is not as expected */
        if (!data[0] || typeof data[0] !== 'string' || data[0].length > 100) {
            pxlogger.debug('invalid cookie format');
            return '';
        }

        /* cookie value is not as expected */
        if (!encryptedCookie || typeof encryptedCookie !== 'string') {
            pxlogger.debug('invalid cookie format');
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
            let hmac = crypto.createHmac(pxconfig.CE_DIGEST, this._cookieSecret);
            hmac.setEncoding('hex');
            hmac.write(hmacStr);
            hmac.end();
            const h = hmac.read();
            return h === cookieHmac;
        } catch (err) {
            pxlogger.error('Error while validating Perimeterx cookie: ' + err.stack)
        }
    }

    verifyDefined(...values) {
        return values.every(value => value !== undefined && value !== null);
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