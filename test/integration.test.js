'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const perimeterx = require('../index');
const superagent = require('superagent');
const pxconfig = require('../lib/pxconfig').conf();
const should = require('should');
const pxtestUtil = require('./test.util');
const SERVER_URL = 'http://localhost:9090';

describe('PX Integration Tests', function () {
    this.timeout(10000);
    let ip = '1.2.3.5';
    let ua = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36';
    let server;
    before((done) => {
        server = express();
        server.use(cookieParser());
        server.get('/', perimeterx.middleware, (req, res) => {
            res.send('Hello from PX');
        });

        server.listen(9090, () => {
            done();
        });
    });

    describe('PX Cookie Evaluation', () => {
        it('PASS - good score cookie, valid time', (done) => {
            const goodCookie = pxtestUtil.goodValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${goodCookie};`)
                .set(pxconfig.IP_HEADER, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    (res.text).should.be.exactly('Hello from PX');
                    (res.status).should.be.exactly(200);
                    return done();
                });
        });

        it('BLOCK - bad score cookie, valid time', (done) => {
            const badCookie = pxtestUtil.badValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${badCookie};`)
                .set(pxconfig.IP_HEADER, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    (res.text).should.be.exactly('BLOCK');
                    (res.status).should.be.exactly(403);
                    return done();
                });
        });
    });

    describe('PX Server 2 Server Evaluation', () => {
        it('PASS - expired cookie. good user', (done) => {
            const goodCookie = pxtestUtil.buildCookieGoodScoreInValid(ip, ua, pxconfig.COOKIE_SECRET_KEY);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${goodCookie};`)
                .set(pxconfig.IP_HEADER, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    (res.text).should.be.exactly('Hello from PX');
                    (res.status).should.be.exactly(200);
                    return done();
                });
        });

        it('BLOCK - expired cookie. bad user', (done) => {
            const goodCookie = pxtestUtil.buildCookieGoodScoreInValid(ip, ua, pxconfig.COOKIE_SECRET_KEY);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${goodCookie};`)
                .set(pxconfig.IP_HEADER, ip)
                .set('User-Agent', 'curl')
                .end((e, res) => {
                    (res.text).should.be.exactly('BLOCK');
                    (res.status).should.be.exactly(403);
                    return done();
                });
        });

        it('PASS - invalid cookie. good user', (done) => {
            const pxCookie = 'bad_cookie';
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${pxCookie};`)
                .set(pxconfig.IP_HEADER, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    (res.text).should.be.exactly('Hello from PX');
                    (res.status).should.be.exactly(200);
                    return done();
                });
        });

        it('BLOCK - invalid cookie. bad user', (done) => {
            const pxCookie = 'bad_cookie';
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${pxCookie};`)
                .set(pxconfig.IP_HEADER, ip)
                .set('User-Agent', 'curl')
                .end((e, res) => {
                    (res.text).should.be.exactly('BLOCK');
                    (res.status).should.be.exactly(403);
                    return done();
                });
        });

        it('PASS - no cookie. good user', (done) => {
            superagent.get(SERVER_URL)
                .set(pxconfig.IP_HEADER, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    (res.text).should.be.exactly('Hello from PX');
                    (res.status).should.be.exactly(200);
                    return done();
                });
        });

        it('BLOCK - no cookie. bad user', (done) => {
            superagent.get(SERVER_URL)
                .set(pxconfig.IP_HEADER, ip)
                .set('User-Agent', 'curl')
                .end((e, res) => {
                    (res.text).should.be.exactly('BLOCK');
                    (res.status).should.be.exactly(403);
                    return done();
                });
        });
    });
});
