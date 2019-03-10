'use strict';

const express = require('express');
const superagent = require('superagent');
const faker = require('faker');
const perimeterx = require('../lib/perimeterx');
const should = require('should');
const testUtil = require('./utils/test.util.js');
const SERVER_URL = 'http://localhost:8081';
const spawn = require('child_process').spawn;

describe('PX Integration Tests', function () {
    this.timeout(3000);
    let ip = '1.2.3.5';
    let ua = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36';
    let server, srvOut = [], srvErr = [];
    let showSvrOutput = process.env.TEST_VERBOSE || false;
    let pxconfig;

    before(function (done) {
        /* init module */
        perimeterx.init(testUtil.initConfigurations);

        /* launch a server with the configured module for assertion */
        server = spawn('node', ['./test/utils/server.sample.js']);
        server.stdout.setEncoding('utf8');
        server.stderr.setEncoding('utf8');

        setTimeout(() => {
            pxconfig = perimeterx.enforcer().config.conf;
            done();
        }, 3 * 1000);

        server.stderr.on('data', function (msg) {
            if (showSvrOutput) console.log("PX Tests Error: ", msg);
            srvErr.push(msg);
        });
    });

    beforeEach(function (done) {
        ip = faker.internet.ip();
        srvOut = [];
        srvErr = [];
        done();
    });

    after(function (done) {
        server.once('exit', () => {
            done();
        });

        server.kill('SIGINT');
        server = undefined;
    });
    describe('PX Cookie Evaluation', () => {
        it('PASS - good score cookie, valid time', (done) => {
            const goodCookie = testUtil.goodValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY, pxconfig);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${goodCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    (res.text).should.be.exactly('Hello from PX');
                    testUtil.assertLogString('cookie invalid', srvOut).should.be.exactly(false);
                    (res.status).should.be.exactly(200);
                    return done();
                });
        });

        it('BLOCK - bad score cookie, valid time', (done) => {
            const badCookie = testUtil.badValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY, pxconfig);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${badCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    (res.status).should.be.exactly(403);
                    testUtil.assertLogString('cookie invalid', srvOut).should.be.exactly(false);
                    return done();
                });
        });
    });

    describe('PX Server 2 Server Evaluation', () => {
        it('PASS - no cookie. good user', (done) => {
            let tempUA = faker.internet.userAgent();
            superagent.get(SERVER_URL)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', tempUA)
                .set('X-PX-TRUE-IP', ip)
                .end((e, res) => {
                    testUtil.assertLogString('Cookie is missing', srvOut).should.be.exactly(true);
                    (res.text).should.be.exactly('Hello from PX');
                    (res.status).should.be.exactly(200);
                    return done();
                });
        });

        it('PASS - expired cookie. good user', (done) => {
            const goodCookie = testUtil.buildCookieGoodScoreInValid(ip, ua, pxconfig.COOKIE_SECRET_KEY, pxconfig);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${goodCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    testUtil.assertLogString('Cookie TTL is expired', srvOut).should.be.exactly(true);
                    (res.text).should.be.exactly('Hello from PX');
                    (res.status).should.be.exactly(200);
                    return done();
                });
        });

        it('BLOCK - expired cookie. bad user', (done) => {
            const goodCookie = testUtil.buildCookieGoodScoreInValid(ip, ua, pxconfig.COOKIE_SECRET_KEY, pxconfig);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${goodCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', 'curl')
                .end((e, res) => {
                    testUtil.assertLogString('Cookie TTL is expired', srvOut).should.be.exactly(true);
                    (res.status).should.be.exactly(403);
                    return done();
                });
        });

        it('BLOCK - cookie decryption failed. good user', (done) => {
            const pxCookie = 'bad_cookie';
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${pxCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('X-PX-TRUE-IP', ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    testUtil.assertLogString('invalid cookie format', srvOut).should.be.exactly(true);
                    (res.status).should.be.exactly(403);
                    return done();
                });
        });

        it('BLOCK - invalid cookie. bad user', (done) => {
            const pxCookie = 'bad_cookie';
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${pxCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', 'curl')
                .end((e, res) => {
                    testUtil.assertLogString('invalid cookie format', srvOut).should.be.exactly(true);
                    (res.status).should.be.exactly(403);
                    return done();
                });
        });


        it('BLOCK - no cookie. bad user', (done) => {
            superagent.get(SERVER_URL)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', 'curl')
                .end((e, res) => {
                    testUtil.assertLogString('Cookie is missing', srvOut).should.be.exactly(true);
                    (res.status).should.be.exactly(403);
                    return done();
                });
        });
    });
    describe('Request Filtering', () => {
        it('PASS - static file request. bad user', (done) => {
            superagent.get(SERVER_URL + '/mytest.js')
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', 'curl')
                .end((e, res) => {
                    (res.status).should.be.exactly(200);
                    return done();
                });
        });
    });
    describe('Sending Activities', () => {
        it('send page_requested activity, dont send block activity', (done) => {
            const goodCookie = testUtil.goodValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY, pxconfig);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${goodCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    testUtil.assertLogString('Sending page requested activity', srvOut).should.be.exactly(true);
                    testUtil.assertLogString('Sending block activity', srvOut).should.be.exactly(false);
                    return done();
                });
        });
        it('send block activity, dont send page_requested activity', (done) => {
            const goodCookie = testUtil.badValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY, pxconfig);
            superagent.get(SERVER_URL)
                .set('Cookie', `_px=${goodCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    testUtil.assertLogString('Sending page requested activity', srvOut).should.be.exactly(false);
                    testUtil.assertLogString('Sending block activity', srvOut).should.be.exactly(true);
                    return done();
                });
        });
    });
    describe('Sensitive routes', () => {
        it("should trigger s2s activity on sensitive_route", (done) => {
            const goodCookie = testUtil.goodValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY, pxconfig);
            superagent.get(`${SERVER_URL}/login`)
                .set('Cookie', `_px=${goodCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    testUtil.assertLogString(`Sensitive route match, sending Risk API. path: /login`, srvOut).should.be.exactly(true);
                    return done();
                });
        });
    });
    describe('Whitelist routes', () => {
        it("should pass request on whitelist_route with bad cookie", (done) => {
            const badCookie = testUtil.badValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY, pxconfig);
            superagent.get(`${SERVER_URL}/account`)
                .set('Cookie', `_px=${badCookie};`)
                .set(pxconfig.IP_HEADERS, ip)
                .set('User-Agent', ua)
                .end((e, res) => {
                    testUtil.assertLogString(`Whitelist route match: /account`, srvOut).should.be.exactly(true);
                    return done();
                });
        });
    });

});
