'use strict';
const pxutil = require('../pxutil');
const Cookie = require('./cookie');

class CookieV1 extends Cookie {

    constructor(ctx, config) {
        super();
        this._pxCookie = ctx.cookies['_px'];
        this._pxConfig = config;
        this._pxContext = ctx;
        this._cookieSecret = config.COOKIE_SECRET_KEY;
    }

    get score() {
        return this.decodedCookie.s.b;
    }

    get hmac() {
        return this.decodedCookie.h;
    }

    isCookieFormatValid(cookie) {
        return cookie !== '' && pxutil.verifyDefined(cookie.t, cookie.s, cookie.s.a, cookie.s.b, cookie.u, cookie.v, cookie.h);
    }

    blockAction() {
        // v1 cookie will always return captcha action
        return 'c';
    }

    isSecure() {
        const baseHmacStr = '' + this.time + this.decodedCookie.s.a + this.score + this.uuid + this.vid;

        // hmac string with IP - for backward support
        const hmacWithIp = baseHmacStr + this._pxContext.ip + this._pxContext.userAgent;

        // hmac string without IP
        const hmacWithoutIp = baseHmacStr + this._pxContext.userAgent;

        return this.isHmacValid(hmacWithoutIp, this.hmac) || this.isHmacValid(hmacWithIp, this.hmac);
    }
}

module.exports = CookieV1;