'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const perimeterx = require('../index');
const superagent = require('superagent');
const pxconfig = require('../lib/pxconfig');
const should = require('should');
const pxtestUtil = require('./test.util');

describe('main tests', function () {
    this.timeout(10000);
    let server;
    before((done) => {
        server = express();
        server.use(cookieParser());
        server.get('/', perimeterx.middleware({
            message: 'px-tests'
        }), (req, res) => {
            res.send('Hello from PX');
        });

        server.listen(8080, () => {
            done()
        });
    });

    after(()=> {
    });

    it('Should pass traffic due to good score in cookie', (done) => {
        const ip = '1.2.3.4';
        const ua = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36';
        const goodCookie = pxtestUtil.goodValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY);
        superagent.get('http://localhost:8080/')
            .set('Cookie', `_px=${goodCookie};`)
            .set(pxconfig.IP_HEADER, ip)
            .set('User-Agent', ua)
            .end((e, res) => {
                (res.text).should.be.exactly('Hello from PX');
                (res.status).should.be.exactly(200);

                return done();

            });
    });

    it('Should block traffic due to bad score in cookie', (done) => {
        const ip = '1.2.3.4';
        const ua = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36';
        const goodCookie = pxtestUtil.badValidCookie(ip, ua, pxconfig.COOKIE_SECRET_KEY);
        superagent.get('http://localhost:8080/')
            .set('Cookie', `_px=${goodCookie};`)
            .set(pxconfig.IP_HEADER, ip)
            .set('User-Agent', ua)
            .end((e, res) => {
                (res.text).should.be.exactly('BLOCK');
                (res.status).should.be.exactly(200);

                return done();

            });
    });
});
