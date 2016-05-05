"use strict";

const express = require('express');
const cookieParser = require('cookie-parser');
const perimeterx = require('../../index');
const testUtil = require('../utils/test.util');

const server = express();

perimeterx.init(testUtil.initConfigurations);

server.use(cookieParser());
server.get('/', perimeterx.middleware, (req, res) => {
    res.send('Hello from PX');
});
console.log('try to stast');

server.listen(8081, () => {
    console.log('test server started');
});

process.on('SIGINT', () => {
    console.info("terminating for SIGINT...");
    process.exit();
});

process.on('SIGTERM', () => {
    console.info("terminating for SIGINT...");
    process.exit();
});