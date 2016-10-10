![image](http://media.marketwire.com/attachments/201604/34215_PerimeterX_logo.jpg)

[PerimeterX](http://www.perimeterx.com) Express.js Middleware
=============================================================

Table of Contents
-----------------

-   [Usage](#usage)
  *   [Dependencies](#dependencies)
  *   [Installation](#installation)
  *   [Basic Usage Example](#basic-usage)
-   [Configuration](#configuration)
  *   [Blocking Score](#blocking-score)
  *   [Custom Block Action](#custom-block)
  *   [Enable/Disable Captcha](#captcha-support)
  *   [Extracting Real IP Address](#real-ip)
  *   [Filter Sensitive Headers](#sensitive-headers)
  *   [API Timeout Milliseconds](#api-timeout)
  *   [Send Page Activities](#send-page-activities)
  *   [Debug Mode](#debug-mode)
-   [Contributing](#contributing)
  *   [Tests](#tests)

<a name="Usage"></a>

<a name="dependencies"></a> Dependencies
----------------------------------------

-   [cookie-parser](https://github.com/expressjs/cookie-parser)

`    $ npm install --save cookie-parser`

<a name="installation"></a> Installation
----------------------------------------

`    $ npm install --save perimeterx-node-express`

### <a name="basic-usage"></a> Basic Usage Example
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

/*  block users with high bot scores using px-module for the route /helloWorld */
server.get('/helloWorld', perimeterx.middleware, (req, res) => {
    res.send('Hello from PX');
});

server.listen(8081, () => {
    console.log('server started');
});
```

Set the PerimeterX middleware on all server's routes:

> When configuring the Perimeterx middleware on all the server's routes, you will have a
> score evaluation on each incoming request. The recommended pattern is to use
> on top of page views routes.

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
server.use(perimeterx.middleware);

/* block high scored users using px-module for route /helloWorld */
server.get('/helloWorld', (req, res) => {
    res.send('Hello from PX');
});

server.listen(8081, () => {
    console.log('server started');
});
```

### <a name="configuration"></a> Configuration Options

#### Configuring Required Parameters

Configuration options are set in `pxConfig`

#### Required parameters:

- pxAppid
- cookieSecretKey
- authToken

##### <a name="blocking-score"></a> Changing the Minimum Score for Blocking

**default:** 70

```javascript
const pxConfig = {
    blockingScore: 75
}
```

#### <a name="custom-block"></a> Custom Blocking Actions

Setting a custom block handler customizes the action that is taken when
a user visits with a high score. Common customizations are to present a
reCAPTHA or custom branded block page.

**default:** pxBlockHandler - return HTTP status code 403 and serve the
Perimeterx block page.

```javascript
function customBlockHandler(req, res, next)
{
    const block_score = req.block_score;
    const block_uuid = req.block_uuid;
    
    /* user defined logic comes here */
}

const pxConfig = {
    blockHandler: customBlockHandler
}
```      

###### Examples

**Serve a Custom HTML Page**

```javascript
function customBlockHandler(req, res, next) {
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    const pxBlockUuid = req.pxBlockUuid;
    const pxBlockScore = req.pxBlockScore;
    const html = `<div>Access to ${fullUrl} has been blocked.</div>
                  <div>Block reference - ${pxBlockUuid}</div>
                  <div>Block score - ${pxBlockScore}</div>`;

    res.writeHead(403, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}
const pxConfig = {
    blockHandler: customBlockHandler
}
```

**Do Not Block, Monitor Only**

```javascript
function customBlockHandler(req, res, next) {
    const block_score = req.block_score;
    const block_uuid = req.block_uuid;

    /* user defined logic comes here */
    
    return next()
}

const pxConfig = {
    blockHandler: customBlockHandler
}
```

#### <a name="captcha-support"></a>Enable/disable captcha in the block page

By enabling captcha support, a captcha will be served as part of the block page giving real users the ability to answer, get score clean up and passed to the requested page.

**default: true**

```javascript

const pxConfig = {
    captchaEnabled: true/false
}
```

##### <a name="real-ip"></a>Extracting the Real User IP Address From HTTP Headers or by defining a function

> Note: IP extraction according to your network setup is important. It is common to have a load balancer/proxy on top of your applications, in this case the PerimeterX module will send an internal IP as the user's. In order to perform processing and detection for server-to-server calls, PerimeterX module need the real user ip.

The user ip can be passed to the PerimeterX module using a custom IP extraction function.

**default with no predefined header:** `req.ip`

**Extract real IP**

```javascript
function getUserIp(req) {
    const ipsHeader = req.get('user-true-ip');
    return ipsHeader.split(',')[0];
}

const pxConfig = {
    getUserIp: getUserIp
}
```

#### <a name="sensitive-headers"></a> Filter sensitive headers

A user can define a list of sensitive header he want to prevent from being send to perimeterx servers, filtering cookie header for privacy is set by default and will be overriden if a user set the configuration

**default: cookie, cookies**

```javascript

const pxConfig = {
    sensitiveHeaders: ['cookie', 'cookies', 'secret-header']
}
```

#### <a name="api-timeout"></a>API Timeout Milliseconds

Timeout in millisceonds to wait for the PerimeterX server API response.
The API is called when the risk cookie does not exist, or is expired or
invalid.

**default:** 1000

```javascript
const pxConfig = {
    apiTimeoutMS: 1500
}
```

#### <a name="send-page-activities"></a> Send Page Activities

Boolean flag to enable or disable sending activities and metrics to
PerimeterX on each page request. Enabling this feature will provide data
that populates the PerimeterX portal with valuable information such as
amount requests blocked and API usage statistics.

**default:** false

```javascript
const pxConfig = {
    sendPageActivities: true
}
```

#### <a name="debug-mode"></a> Debug Mode

Enables debug logging

**default:** false

```javascript
const pxConfig = {
    debugMode: true
}
```
<a name="contributing"></a> Contributing
----------------------------------------

By forking the repository, renaming `tests/utils/test.util.js.dist` into `tests/utils/test.util.js` and changing your configurations on
`tests/utils/test.util.js` you can easily setup a development kit.

##### <a name="tests"></a> Running tests

```
$ TEST_VERBOSE=true/false mocha
```

> Note: running tests without a valid PerimeterX app id, auth token and
> cookie key will not work.

