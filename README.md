[![Build Status](https://travis-ci.org/PerimeterX/perimeterx-node-express.svg?branch=master)](https://travis-ci.org/PerimeterX/perimeterx-node-express)

![image](https://s.perimeterx.net/logo.png)

[PerimeterX](http://www.perimeterx.com) Express.js Middleware
=============================================================

> Latest stable version: [v3.0.1](https://www.npmjs.com/package/perimeterx-node-express)

Table of Contents
-----------------

-   [Usage](#usage)
  *   [Installation](#installation)
  *   [Basic Usage Example](#basic-usage)
-   [Configuration](#configuration)
  *   [Blocking Score](#blocking-score)
  *   [Customizing Block Page](#custom-block-page)
  *   [Custom Block Action](#custom-block)
  *   [Select CAPTCHA provider](#captcha-support)
  *   [Module Mode](#modulemode-support)
  *   [Extracting Real IP Address](#real-ip)
  *   [Filter Sensitive Headers](#sensitive-headers)
  *   [API Timeout Milliseconds](#api-timeout)
  *   [Send Page Activities](#send-page-activities)
  *   [Debug Mode](#debug-mode)
-   [Contributing](#contributing)
  *   [Tests](#tests)

<a name="Usage"></a>

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
    moduleMode: 1,
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

> When configuring the PerimeterX middleware on all the server's routes, you will have a
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
    moduleMode: 1,
    blockingScore: 60
};
perimeterx.init(pxConfig);
server.use(cookieParser());
/* block high scored users using px-module for all routes */
server.use(perimeterx.middleware);

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
- moduleMode

##### <a name="blocking-score"></a> Changing the Minimum Score for Blocking

**Default blocking value:** 70

```javascript
const pxConfig = {
    blockingScore: 75
}
```

### <a name="custom-block"></a> Customizing Block Page
#### Customizing Logo
Adding a custom logo to the blocking page is by providing the pxConfig a key ```customLogo``` , the logo will be displayed at the top div of the the block page
The logo's ```max-heigh``` property would be 150px and width would be set to ```auto```

The key customLogo expects a valid URL address such as https://s.perimeterx.net/logo.png
Example below:
```javascript
const pxConfig = {
  ...
  customLogo: 'https://s.perimeterx.net/logo.png'
  ...
}
```

#### Customizing CSS/JS
Custom JS/CSS

The block page can be modified with a custom CSS by adding to the pxConfig the key ```cssRef``` and providing a valid URL to the css In addition there is also the option to add a custom JS file by adding ```jsRef``` key to the pxConfig and providing the JS file that will be loaded with the block page, this key also expects a valid URL

On both cases if the URL is not a valid format an exception will be thrown

Example below:
```javascript
const pxConfig = {
  ...
  cssRef: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'
  jsRef: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js'
  ...
}
```

#### <a name="custom-block"></a> Custom Blocking Actions

In order to customize the action performed on a valid block value, supply a user-defined customBlockHandler function.

The custom handler would contain the action to be taken when a visitor receives a score higher than the 'blockingScore' value. Common customization options are presenting of a reCAPTCHA, or supplying a custom branded block page.

**Default block behaviour:** pxBlockHandler - returns an HTTP status code of 403 and serves the PerimeterX block page.

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

#### <a name="captcha-support"></a>Select CAPTCHA provider

The CAPTCHA part of the block page can use one of the following:
* [reCAPTCHA](https://www.google.com/recaptcha)
* [FunCaptcha](https://www.funcaptcha.com/)
**Default: reCaptcha**

```javascript
const pxConfig = {
    captchaProvider: 'funCaptcha'
}
```

#### <a name="modulemode-support"></a>Module Mode

**Default: 0**

**Possible Values:**

- `0` - Module does not block users crossing the predefined block threshold. The custom blocking action function will be evaluated in case one is supplied, upon crossing the defined block threshold.
- `1` - Module blocks users crossing the predefined block threshold. Server-to-server requests are sent synchronously.

```javascript
const pxConfig = {
    moduleMode: 1
}
```

##### <a name="real-ip"></a>Extracting the Real User's IP Address

>Note: IP extraction, according to your network setup, is very important. It is common to have a load balancer/proxy on top of your applications, in which case the PerimeterX module will send the system's internal IP as the user's. In order to properly perform processing and detection on server-to-server calls, PerimeterX module needs the real user's IP.

The user's IP can be passed to the PerimeterX module using a custom user defined function on the `pxConfig` variable.

**Default with no predefined header:** `req.ip`

**Extract the real IP from a custom header**

```javascript
const pxConfig = {
    ipHeaders: ['x-true-ip', 'x-some-other-header']
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

A boolean flag to determine whether or not to send activities and metrics to PerimeterX, on each page request. Disabling this feature will prevent PerimeterX from receiving data populating the PerimeterX portal, containing valuable information such as the amount of requests blocked and other API usage statistics.

**Default:** true

```javascript
const pxConfig = {
    sendPageActivities: false
}
```

#### <a name="debug-mode"></a> Debug Mode

Enables debug logging mode.

**Default:** false

```javascript
const pxConfig = {
    debugMode: true
}
```
<a name="contributing"></a> Contributing
----------------------------------------

The following steps are welcome when contributing to our project:
### Fork/Clone
First and foremost, [Create a fork](https://guides.github.com/activities/forking/) of the repository, and clone it locally.
Create a branch on your fork, preferably using a self descriptive branch name.

### Code/Run
Help improve our project by implementing missing features, adding capabilites or fixing bugs.

To run the code, simply follow the steps in the [installation guide](#installation). Grab the keys from the PerimeterX Portal, and try refreshing your page several times continously. If no default behaviours have been overriden, you should see the PerimeterX block page. Solve the CAPTCHA to clean yourself and start fresh again.

Feel free to check out the [Example App](https://nodejs-smaple-app.perimeterx.com), to have a feel of the project.

### Test
> Tests for this project are written using [Mocha](https://mochajs.org/).

**Dont forget to test**. The project relies heavily on tests, thus ensuring each user has the same experience, and no new features break the code.
Before you create any pull request, make sure your project has passed all tests, and if any new features require it, write your own.

By forking the repository, renaming `test/utils/test.util.js.dist` into `test/utils/test.util.js` and changing your configurations on
`test/utils/test.util.js` you can easily setup a development kit.

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
