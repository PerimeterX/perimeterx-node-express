# PerimeterX Express.js Middleware

## Table of Contents

* [Usage](#usage)
 * [Install](#usage-installation)
 * [Basic Usage Example](#basic-usage)
* [Configuration](#pxConfig)
 * [Blocking Score](#blockingScore)
 * [Block Handler](#blockHandler)
 * [User IP](#userIp)
 * [API Timeout Milliseconds](#apiTimeoutMS)
 * [Send Page Activities](#sendPageActivities)
 * [Debug Mode](#debugMode)
* [Contributing](#contributing)

## <a name="usage"></a> Usage

#### <a name="usage-installation"></a> Install

```bash
npm install --save perimeterx-node-express
```

PerimeterX module depend on cookie-parser in order to evaluate risk cookie score

```bash
npm instal --save cookie-parser
```

#### <a name="basic-usage"></a> Basic Usage Example:

```javascript
"use strict";

const express = require('express');
const cookieParser = require('cookie-parser');
const perimeterx = require('perimeterx-node-express');

const server = express();

/* px-module and cookie parser need to be initiated before any route usage */
const pxConfig = {
    pxAppId: 'PX_APP_ID',
    cookieSecretKey: 'PX_RISK_COOKIE_SECRET',
    authToken: 'PX_TOKEN',
    blockingScore: 60
};
perimeterx.init(pxConfig);
server.use(cookieParser());

/* block high scored users using px-module for route /helloWorld */
server.get('/helloWorld', perimeterx.middleware, (req, res) => {
    res.send('Hello from PX');
});

server.listen(8081, () => {
    console.log('server started');
});
```

## <a name="pxConfig"></a> `pxConfig` options

PerimeterX module comes with a set of default configurable configurations. expect for the manadatories (application id, cookie secret and auth token) every change is optional.

#### <a name="blockingScore"></a> Blocking Score 

Minimum score for blocking.

**default:** 70

```javascript
const pxConfig = {
    blockingScore: 75
}
```

#### <a name="blockHandler"></a> Block Handler 

Middleware function block handler, to perform a custom logic when an high scored user has been detected.

**default:** pxBlockHandler - return code 403 and serve perimeterx block page.

```javascript
function customBlockHandler(req, res, next) {
    const block_score = req.block_score;
    const block_uuid = req.block_uuid;

    /* user defined logic comes here */
}

const pxConfig = {
    blockHandler: customBlockHandler
}
```

#### <a name="userIp"></a> User IP

In order to evaluate user's score properly, perimeterx module require the real socket ip belong to the user.  user ip can be passed to perimeterx module using an HTTP header or by enriching the request object.

**default with no predefined header:** `req.ip`

**default header**: `px-user-ip`

```javascript
/* user ip retrieved in perimeterx module */
const userIp = req.get(pxConfig.IP_HEADER) || req.px_user_ip || req.ip;

const pxConfig = {
  ipHeader: 'user-real-ip'
}
```

#### <a name="apiTimeoutMS"></a> API Timeout Milliseconds 

Timeout in millisceonds to wait for perimeterx api response (when cookie not exist/expired/invalid).

**default:** 1000

```javascript
const pxConfig = {
  apiTimeoutMS: 1500
}
```

#### <a name="sendPageActivities"></a> Send Page Activities 

Boolean flag to determine if px module will send activities to px servers on each page request, this will assist perimeterx on identifying attackers.

**default:** false

```javascript
const pxConfig = {
  sendPageActivities: true
}
```

#### <a name="debugMode"></a> Debug Mode 

Turns on debug logging.

**default:** false

```javascript
const pxConfig = {
  debugMode: true
}
```

## <a name="contributing"></a> Contributing
If you wish yo contribute to perimeterx expressjs middlware, we would apriciate your contribution and will take seriously any open issue/pull request submitted. 

By forking the repository and changing your configurations on `tests/utils/test.util.js` you can easily setup a development kit.

**Run Tests**:

```bash
TEST_VERBOSE=true/false mocha
```

## Copyright

Copyright &copy; 2016 [PerimeterX](http://www.perimetrex.com).