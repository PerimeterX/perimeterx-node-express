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

The PerimeterX module depends on cookie-parser for cookie parsing

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

/* the px-module and cookie parser need to be initialized before any route usage */
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

The PerimeterX module comes with a set of possible configurations settings. Default values are supplied to all setting except for the following required fields: application id, cookie secret and auth token.
The following are the other possible configuration values:

#### <a name="blockingScore"></a> Blocking Score

Minimum score for blocking.

**default:** 70

```javascript
const pxConfig = {
    blockingScore: 75
}
```

#### <a name="blockHandler"></a> Block Handler

The blockHandler config setting can be used to provide custom logic in the case of a request / user with a high score

**default:** pxBlockHandler - return code 403 and serve the default PerimeterX block page.

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

In order to evaluate the user's score properly, the PerimeterX module requires the real socket ip the user is coming from. This can be passed using an HTTP header or by enriching the request object.

**default with no predefined header:** `req.ip`

**default header**: `px-user-ip`

```javascript
/* user ip retrieved in perimeterx module */
const userIp = req.get(pxConfig.ipHeader) || req.px_user_ip || req.ip;

const pxConfig = {
  ipHeader: 'user-real-ip'
}
```

#### <a name="apiTimeoutMS"></a> API Timeout Milliseconds

The PerimeterX API request timeout (which is called when a cookie does not exist/is expired/is invalid).

**default:** 1000

```javascript
const pxConfig = {
  apiTimeoutMS: 1500
}
```

#### <a name="sendPageActivities"></a> Send Page Activities

A flag which determines whether the module sends activities to the PerimeterX servers on each page request or not. This will assist PerimeterX in identifying attackers. It can be turned off for scenarios such as testing or for performance sake.

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
If you wish to contribute to the PerimeterX expressjs middlware, we would appreciate your contribution and will take seriously any open issue/pull request submitted.

By forking the repository and changing your configurations on `tests/utils/test.util.js` you can easily setup a development kit.

**Run Tests**:

```bash
TEST_VERBOSE=true/false mocha
```

## Copyright

Copyright &copy; 2016 [PerimeterX](http://www.perimetrex.com).
