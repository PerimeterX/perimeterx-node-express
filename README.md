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

Setting the PerimeterX middleware on all server's routes:

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

Configuration options are set in the `pxConfig` variable.

#### Required parameters:
> All parameters are obtainable via the PerimeterX Portal. (Applications page)

- pxAppid
- cookieSecretKey
- authToken

##### <a name="blocking-score"></a> Changing the Minimum Score for Blocking

**Default blocking value:** 70

```javascript
const pxConfig = {
    blockingScore: 75
}
```

#### <a name="custom-block"></a> Custom Blocking Actions

In order to customize the action performed on a valid block value, supply a user-defined customBlockHandler function.

The custom handler would contain the action to be taken when a visitor receives a score higher than the 'blockingScore' value. Common customization options are presenting of a reCAPTCHA, or supplying a custom branded block page.

**Default block behaviour:** pxBlockHandler - return an HTTP status code of 403 and serve the PerimeterX block page.

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

**Serving a Custom HTML Page**

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

**No Blocking, Monitor Only**

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

#### <a name="captcha-support"></a>Enable/Disable CAPTCHA on the block page

By enabling CAPTCHA support, a CAPTCHA will be served as part of the block page, giving real users the ability to identify as a human. By solving the CAPTCHA, the user's score is then cleaned up and the user is allowed to continue.

**Default: true**

```javascript
const pxConfig = {
    captchaEnabled: false
}
```

##### <a name="real-ip"></a>Extracting the Real User's IP Address

>Note: IP extraction, according to your network setup, is very important. It is common to have a load balancer/proxy on top of your applications, in which case the PerimeterX module will send the system's internal IP as the user's. In order to properly perform processing and detection on server-to-server calls, PerimeterX module needs the real user's IP.

The user's IP can be passed to the PerimeterX module using a custom user defined function on the `pxConfig` variable.

**Default with no predefined header:** `req.ip`

**Extract real IP from a custom header**

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
A list of sensitive headers can be configured to prevent specific headers from being sent to PerimeterX servers (lower case header names). Filtering cookie headers for privacy is set by default, and can be overridden on the `pxConfig` variable.

**Default: cookie, cookies**

```javascript
const pxConfig = {
    sensitiveHeaders: ['cookie', 'cookies', 'secret-header']
}
```

#### <a name="api-timeout"></a>API Timeout Milliseconds

> Note: Controls the timeouts for PerimeterX requests. The API is called when a Risk Cookie does not exist, or is expired or invalid.
API Timeout in Milliseconds to wait for the PerimeterX server API response.

**Default:** 1000

```javascript
const pxConfig = {
    apiTimeoutMS: 1500 
}
```

#### <a name="send-page-activities"></a> Send Page Activities

Boolean flag to enable or disable sending of activities and metrics to PerimeterX on each page request. Enabling this feature will provide data that populates the PerimeterX portal with valuable information such as the amount of requests blocked and additional API usage statistics.

**Default:** false

```javascript
const pxConfig = {
    sendPageActivities: true
}
```

#### <a name="debug-mode"></a> Debug Mode

Enables debug logging mode

**Default:** false

```javascript
const pxConfig = {
    debugMode: true
}
```
<a name="contributing"></a> Contributing
----------------------------------------

The following steps are welcome when contributing to our project.
### Fork/Clone
First and foremost, [Create a fork](https://guides.github.com/activities/forking/) of the repository, and clone it locally.
Create a branch on your fork, preferably using a self descriptive branch name.

### Code/Run
Code your way out of your mess, and help improve our project by implementing missing features, adding capabilites or fixing bugs.

To run the code, simply follow the steps in the [installation guide](#installation). Grab the keys from the PerimeterX Portal, and try refreshing your page several times continously. If no default behaviours have been overriden, you should see the PerimeterX block page. Solve the CAPTCHA to clean yourself and start fresh again.

Feel free to check out the [Example App](https://nodejs-smaple-app.perimeterx.com), to have a feel of the project.

### Test
> Tests for this project are written using [Mocha](https://mochajs.org/).

**Dont forget to test**. The project relies heavily on tests, thus ensuring each user has the same experience, and no new features break the code.
Before you create any pull request, make sure your project has passed all tests, and if any new features require it, write your own.

By forking the repository, renaming `tests/utils/test.util.js.dist` into `tests/utils/test.util.js` and changing your configurations on
`tests/utils/test.util.js` you can easily setup a development kit.

##### <a name="tests"></a> Running tests

```
$ TEST_VERBOSE=true/false mocha
```

> Note: running tests without a valid PerimeterX app id, auth token and
> cookie key will not work.

### Pull Request
After you have completed the process, create a pull request to the Upstream repository. Please provide a complete and thorough description explaining the changes. Remember this code has to be read by our maintainers, so keep it simple, smart and accurate.

### Thanks
After all, you are helping us by contributing to this project, and we want to thank you for it.
We highly appreciate your time invested in contributing to our project, and are glad to have people like you - kind helpers.
