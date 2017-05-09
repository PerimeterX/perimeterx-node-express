'use strict';
const pxutil = require('../pxutil');
const Cookie = require('./cookie');

class CookieV3 extends Cookie {

    constructor(ctx, config) {
        super();
        let [hash, ...cookie] = ctx.cookies['_px3'].split(':');
        cookie = cookie.join(':');
        this._pxCookie = cookie;
        this.cookieHash = hash;
        this._pxConfig = config;
        this._pxContext = ctx;
        this._cookieSecret = config.COOKIE_SECRET_KEY;
    }

    get score() {
        return this.decodedCookie.s;
    }

    get hmac() {
        return this.cookieHash;
    }

    isCookieFormatValid(cookie) {
        return cookie !== '' && pxutil.verifyDefined(cookie.t, cookie.s, cookie.u, cookie.v, cookie.a);
    }

    get blockAction() {
        return this.decodedCookie.a;
    }

    isSecure() {
        const hmacStr = this._pxCookie + this._pxContext.userAgent;

        return this.isHmacValid(hmacStr, this.hmac);
    }
}

module.exports = CookieV3;