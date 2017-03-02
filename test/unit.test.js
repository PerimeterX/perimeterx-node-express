'use strict';

const should = require('should');
const pxutil = require('../lib/utils/pxutil');

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

    beforeEach(()=> {
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

    it('blocking score should be 80', (done) => {
        params.blockingScore = 80;
        pxconfig.init(params);
        const conf = pxconfig.conf();
        conf.BLOCKING_SCORE.should.be.exactly(80);
        done();
    });

    it('getUserIp function should be overridden', (done) => {
        params.getUserIp = function() {
            return '1.2.3.4';
        };

        pxconfig.init(params);
        const conf = pxconfig.conf();
        conf.GET_USER_IP().should.be.exactly('1.2.3.4');
        done();
    });

    it('blockHandler function should be overridden', (done) => {
        params.blockHandler = function() {
            return 'Blocked';
        };

        pxconfig.init(params);
        const conf = pxconfig.conf();
        conf.BLOCK_HANDLER().should.be.exactly('Blocked');
        done();
    });

    it('should set captchaEnabled to false',() => {
      params.captchaEnabled = false;
      pxconfig.init(params);
      const conf = pxconfig.conf();
      conf.CAPTCHA_ENABLED.should.be.exactly(false);
    });

    it('should set enableModule to false',() => {
      params.enableModule = false;
      pxconfig.init(params);
      const conf = pxconfig.conf();
      conf.ENABLE_MODULE.should.be.exactly(false);
    });

    it('should set sendPageActivities to false',() => {
      params.sendPageActivities = false;
      pxconfig.init(params);
      const conf = pxconfig.conf();
      conf.SEND_PAGE_ACTIVITIES.should.be.exactly(false);
    });

    it('should set debugMode to true',() => {
      params.sendPageActivities = true;
      pxconfig.init(params);
      const conf = pxconfig.conf();
      conf.DEBUG_MODE.should.be.exactly(true);
    });
});
