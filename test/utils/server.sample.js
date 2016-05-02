"use strict";

const express = require('express');
const cookieParser = require('cookie-parser');
const perimeterx = require('../../index');

const server = express();

perimeterx.init({
    pxAppId: 'PX3tHq532g',
    cookieSecretKey: 'VYMugZj32NYG5jtpC+Nd39o4SuVCjm5y3QWH7+4xtY6Zc7uvG3/kk9TvbGuyKBTj',
    authToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzY29wZXMiOlsicmlza19zY29yZSIsInJlc3RfYXBpIl0sImlhdCI6MTQ2MTA3NzM3MSwic3ViIjoiUFgzdEhxNTMyZyIsImp0aSI6IjRiYzU5ZDNiLWVkNGItNGRjOC1hZWI4LTk5N2UyNjhmNDMxZSJ9.sNS72J_XsHkAIxnwwAJmCVjwCmK77mt4QF2yeXJIqUc',
    sendPageActivities: true
});

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