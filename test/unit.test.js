'use strict';

const should = require('should');
const sinon = require('sinon');
const rewire = require("rewire");
const pxutil = require('../lib/utils/pxutil');
const pxhttpc = require('../lib/utils/pxhttpc');
var pxapi = rewire('../lib/utils/pxapi');

describe('PX Utils - pxutils.js', () => {
    it('should generate headers array from headers object', (done) => {
        const formattedHeaders = pxutil.formatHeaders({K: 'v'});
        (Object.prototype.toString.call(formattedHeaders)).should.be.exactly('[object Array]');
        formattedHeaders[0]['name'].should.be.exactly('K');
        formattedHeaders[0]['value'].should.be.exactly('v');
        return done();
    });
});

describe('PX Configurations - pxconfig.js', () => {
    let pxconfig;
    let params;

    beforeEach(() => {
        params = {
            pxAppId: 'PX_APP_ID',
            cookieSecretKey: 'PX_COOKIE_SECRET',
            authToken: 'PX_AUTH_TOKEN',
            sendPageActivities: true,
            blockingScore: 60,
            debugMode: true,
            ipHeader: 'x-px-true-ip',
            maxBufferLength: 1
        };

        pxconfig = require('../lib/pxconfig');
    });

    it('should set baseUrl to sapi-<appid>.perimeterx.net', (done) => {
        params.pxAppId = 'PXJWbMQarF';
        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.SERVER_HOST.should.be.exactly(`https://sapi-${params.pxAppId.toLowerCase()}.perimeterx.net`)
        done();
    });

    it('blocking score should be 80', (done) => {
        params.blockingScore = 80;
        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.BLOCKING_SCORE.should.be.exactly(80);
        done();
    });

    it('getUserIp function should be overridden', (done) => {
        params.getUserIp = function () {
            return '1.2.3.4';
        };

        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.GET_USER_IP().should.be.exactly('1.2.3.4');
        done();
    });

    it('blockHandler function should be overridden', (done) => {
        params.blockHandler = function () {
            return 'Blocked';
        };

        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.BLOCK_HANDLER().should.be.exactly('Blocked');
        done();
    });

    it('should set enableModule to false', () => {
        params.enableModule = false;
        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.ENABLE_MODULE.should.be.exactly(false);
    });

    it('should set sendPageActivities to false', () => {
        params.sendPageActivities = false;
        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.SEND_PAGE_ACTIVITIES.should.be.exactly(false);
    });

    it('should set debugMode to true', () => {
        params.sendPageActivities = true;
        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.DEBUG_MODE.should.be.exactly(true);
    });

    it('customLogo should be overridden', () => {
        params.customLogo = 'http://www.google.com/logo.jpg';
        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.CUSTOM_LOGO.should.be.exactly('http://www.google.com/logo.jpg');
    });

    it('jsRef should be overridden', () => {
        params.jsRef = ['http://www.google.com/script.js'];
        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.JS_REF[0].should.equal('http://www.google.com/script.js');
    });

    it('cssRef should be overridden', () => {
        params.cssRef = ['http://www.google.com/stylesheet.css'];
        pxconfig.init(params);
        const conf = pxconfig.conf;
        conf.CSS_REF[0].should.equal('http://www.google.com/stylesheet.css');
    });

});

describe('PX API - pxapi.js', () => {
    it('should add px_orig_cookie to risk_api when decryption fails', (done) => {
        //Stubbing the pxhttpc callServer functions
        sinon.stub(pxhttpc, 'callServer').callsFake((data, headers, uri, callType, callback) => {
            return callback(data)
        });

        //Using rewire to get callServer function
        var pxApiCallServerFunc = pxapi.__get__('callServer');

        // Prepare pxCtx
        var pxCtx = {
            ip: '1.2.3.4',
            fullUrl: 'stub',
            vid: 'stub',
            uuid: 'stub',
            uri: 'stub',
            headers: 'stub',
            httpVersion: 'stub',
            s2sCallReason: 'cookie_decryption_failed',
            httpMethod: 'stub',
            cookie: 'abc'
        }

        pxApiCallServerFunc(pxCtx, data => {
            data.additional.px_orig_cookie.should.equal('abc')
            done();
        });

    });
});
