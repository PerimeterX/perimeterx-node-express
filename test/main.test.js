'use strict';

const express = require('express');
const perimeterx = require('../index');
const superagent = require('superagent');
const should = require('should');

describe('main tests', () => {
    let server;
    before(function(done) {
        server = express();
        server.use(perimeterx.init({
            message: 'px-tests'
        }));

        server.listen(8080, () => {
            done()
        });
    });

    it('should return 200 status code with welcome message', (done) => {
        superagent.get('http://localhost:8080/')
            .end((e, res) => {
                (res.text).should.be.exactly('Hello From PX px-tests');
                (res.status).should.be.exactly(200);
                return done();
            });
    });
});
