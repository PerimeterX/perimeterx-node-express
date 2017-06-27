class PxContext {

    constructor(config, request) {
        const userAgent = request.get('user-agent') || request.get('User-Agent') || 'none';
        this.cookies = {};
        Object.keys(request.cookies).forEach(key => {
            if (key.match(/_px\d?/)) {
                this.cookies[key] = request.cookies[key];
            }
        });
        this.ip = (typeof config.GET_USER_IP === 'function' && config.GET_USER_IP(request)) || request.get(config.IP_HEADER) || request.px_user_ip || request.ip;
        this.headers = request.headers;
        this.hostname = request.hostname;
        this.userAgent = userAgent;
        this.uri = request.originalUrl || '/';
        this.fullUrl = request.protocol + '://' + request.get('host') + request.originalUrl;
        this.httpVersion = request.httpVersion || '';
        this.httpMethod = request.method || '';
        this.sensitiveRoute = this.checkSensitiveRoute(config.SENSITIVE_ROUTES, this.uri);
    }

    get vid() {
        return this._vid;
    }
    set vid(value) {
        this._vid = value;
    }
    get uuid() {
        return this._uuid;
    }
    set uuid(value) {
        this._uuid = value;
    }
    get blockAction() {
        return this._blockAction;
    }
    set blockAction(value) {
        this._blockAction = value;
    }
    get blockActionData() {
        return this._blockActionData;
    }
    set blockActionData(value) {
        this._blockActionData = value;
    }
    get score() {
        return this._score;
    }
    set score(value) {
        this._score = value;
    }
    get s2sCallReason() {
        return this._s2sCallReason;
    }
    set s2sCallReason(value) {
        this._s2sCallReason = value;
    }
    get cookie() {
        return this.cookies['_px3'] ? this.cookies['_px3'] : this.cookies['_px'];
    }
    get decodedCookie() {
        return this._decodedCookie;
    }
    set decodedCookie(value) {
        this._decodedCookie = value;
    }

    /**
     * checkSensitiveRoute - checks whether or not the current uri is a sensitive_route.
     * @param {array} sensitiveRoutes - array of sensitive routes defined by the user, default value in pxconfig: []
     * @param {string} uri - current uri, taken from request
     *
     * @return {boolean} flag sensitive_route true/false.
     */
    checkSensitiveRoute(sensitiveRoutes, uri) {
        return sensitiveRoutes.some(sensitiveRoute => uri.startsWith(sensitiveRoute) );
    }
}

module.exports = PxContext;