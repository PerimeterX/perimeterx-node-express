[![Build Status](https://travis-ci.org/PerimeterX/perimeterx-node-express.svg?branch=master)](https://travis-ci.org/PerimeterX/perimeterx-node-express)

![image](https://s.perimeterx.net/logo.png)

[PerimeterX](http://www.perimeterx.com) Express.js Middleware
=============================================================

> Latest stable version: [v3.2.1](https://www.npmjs.com/package/perimeterx-node-express)

Table of Contents
-----------------
- [Installation](#installation)
- [Basic Usage Example](#basicUsage)
- [Advanced Blocking Response](#advancedBlockingResponse)
- [Advanced Configuration Options](#configuration)
    * [Module Enabled](#moduleEnabled)
    * [Module Mode](#moduleMode)
    * [CAPTCHA Provider](#captchaProvider)
    * [Blocking Score](#blockingScore)
    * [Send Page Activities](#sendPageActivities)
    * [Send Block Activities](#sendBlockActivities)
    * [Debug Mode](#debugMode)
    * [Sensitive Routes](#sensitiveRoutes)
    * [Whitelist Routes](#whitelistRoutes)
    * [Sensitive Headers](#sensitiveHeaders)
    * [IP Headers](#ipHeaders)
    * [First Party Enabled](#firstPartyEnabled)
    * [Custom Request Handler](#customRequestHandler)
    * [Additional Activity Handler](#additionalActivityHandler)

## <a name="installation"></a> Installation
PerimeterX Express.js middleware is installed via NPM:
`$ npm install --save perimeterx-node-express`

## <a name="basicUsage"></a> Basic Usage Example
To use PerimeterX middleware on a specific route follow this example:

```javascript
"use strict";

const express = require('express');
const perimeterx = require('perimeterx-node-express');

const server = express();

/* px-module and cookie parser need to be initiated before any route usage */
const pxConfig = {
    pxAppId: 'PX_APP_ID',
    cookieSecretKey: 'PX_RISK_COOKIE_SECRET',
    authToken: 'PX_TOKEN'
};
perimeterx.init(pxConfig);

/*  block users with high bot scores using px-module for the route /helloWorld */
server.get('/helloWorld', perimeterx.middleware, (req, res) => {
    res.send('Hello from PX');
});

server.listen(8081, () => {
    console.log('server started');
});
```

**Note:** app id, cookie secret and auth token are required fields.

Setting the PerimeterX middleware on all server's routes:

> When configuring the PerimeterX middleware on all the server's routes, you will have a
> score evaluation on each incoming request. The recommended pattern is to use
> on top of page views routes.

```javascript
"use strict";

const express = require('express');
const perimeterx = require('perimeterx-node-express');

const server = express();

/* the px-module and cookie parser need to be initialized before any route usage */
const pxConfig = {
    pxAppId: 'PX_APP_ID',
    cookieSecretKey: 'PX_RISK_COOKIE_SECRET',
    authToken: 'PX_TOKEN'
};
perimeterx.init(pxConfig);

/* block high scored users using px-module for all routes */
server.use(perimeterx.middleware);

server.get('/helloWorld', (req, res) => {
    res.send('Hello from PX');
});

server.listen(8081, () => {
    console.log('server started');
});
```

## <a name="advancedBlockingResponse"></a>Advanced Blocking Response
In special cases, (such as XHR post requests) a full Captcha page render might not be an option. In such cases, using the Advanced Blocking Response returns a JSON object continaing all the information needed to render your own Captcha challenge implementation, be it a popup modal, a section on the page, etc. The Advanced Blocking Response occurs when a request contains the *Accept* header with the value of `application/json`. A sample JSON response appears as follows:

```javascript
{
    "appId": String,
    "jsClientSrc": String,
    "firstPartyEnabled": Boolean,
    "vid": String,
    "uuid": String,
    "hostUrl": String,
    "blockScript": String
}
```

Once you have the JSON response object, you can pass it to your implementation (with query strings or any other solution) and render the Captcha challenge.

In addition, you can add the `_pxOnCaptchaSuccess` callback function on the window object of your Captcha page to react according to the Captcha status. For example when using a modal, you can use this callback to close the modal once the Captcha is successfullt solved. <br/> An example of using the `_pxOnCaptchaSuccess` callback is as follows:

```javascript
window._pxOnCaptchaSuccess = function(isValid) {
    if(isValid) {
        alert("yay");
    } else {
        alert("nay");
    }
}
```
For details on how to create a custom Captcha page, refer to the [documentation]()

## <a name="configuration"></a>Advanced Configuration Options

In addition to the basic installation configuration [above](#basicUsage), the following configurations options are available:

#### <a name="moduleEnabled"></a>Module Enabled
A boolean flag to enable/disable the PerimeterX Enforcer.

**Default:** true

```js
const pxConfig = {
  ...
  moduleEnabled: false
  ...
};
```

#### <a name="moduleMode"></a>Module Mode
Sets the working mode of the Enforcer.

Possible values:

* `0` - Monitor Mode
* `1` - Blocking Mode

**Default:** `0` - Monitor Mode

```js
const pxConfig = {
  ...
  moduleMode: 1
  ...
};
```

#### <a name="captchaProvider"></a>CAPTCHA Provider
Sets the CAPTCHA provider that is displayed on the PerimeterX default CAPTCHA page.

Possible values:

* `reCaptcha` - Use Google reCaptcha as the CAPTCHA provider.
* `funCaptcha`- Use FunCaptcha as the CAPTCHA provider.

**Default:** `reCaptcha`

```js
const pxConfig = {
  ...
  captchaProvider: 'funCaptcha'
  ...
};
```

#### <a name="blockingScore"></a>Blocking Score
Sets the minimum blocking score of a request.

Possible values:

* Any integer between 0 and 100.

**Default:** 100

```js
const pxConfig = {
  ...
  blockingScore: 100
  ...
};
```

#### <a name="sendPageActivities"></a>Send Page Activities
A boolean flag to enable/disable sending activities and metrics to PerimeterX with each request. <br/>
Enabling this feature allows data to populate the PerimeterX Portal with valuable information, such as the number of requests blocked and additional API usage statistics.

**Default:** true

```js
const pxConfig = {
  ...
  sendPageActivities: true
  ...
};
```

#### <a name="sendBlockActivities"></a>Send Block Activities
A boolean flag to enable/disable sending block activities to PerimeterX with each request.

**Default:** true

```js
const pxConfig = {
  ...
  sendBlockActivities: true
  ...
};
```

#### <a name="debugMode"></a>Debug Mode
A boolean flag to enable/disable the debug log messages.

**Default:** false

```js
const pxConfig = {
  ...
  debugMode: true
  ...
};
```

#### <a name="sensitiveRoutes"></a> Sensitive Routes
An array of route prefixes that trigger a server call to PerimeterX servers every time the page is viewed, regardless of viewing history.

**Default:** Empty

```js
const pxConfig = {
  ...
  sensitiveRoutes: ['/login', '/user/checkout']
  ...
};
```

#### <a name="whitelistRoutes"></a> Whitelist Routes
An array of route prefixes which will bypass enforcement (will never get scored).

**Default:** Empty

```js
const pxConfig = {
  ...
  whitelistRoutes: ['/about-us', '/careers']
  ...
};
```

#### <a name="sensitiveHeaders"></a>Sensitive Headers
An array of headers that are not sent to PerimeterX servers on API calls.

**Default:** ['cookie', 'cookies']

```js
const pxConfig = {
  ...
  sensitiveHeaders: ['cookie', 'cookies', 'x-sensitive-header']
  ...
};
```

#### <a name="ipHeaders"></a>IP Headers
An array of trusted headers that specify an IP to be extracted.

**Default:** Empty

```js
const pxConfig = {
  ...
  ipHeaders: ['x-user-real-ip']
  ...
};
```

#### <a name="firstPartyEnabled"></a>First Party Enabled
A boolean flag to enable/disable first party mode.

**Default:** true

```js
const pxConfig = {
  ...
  firstPartyEnabled: false
  ...
};
```

#### <a name="customRequestHandler"></a>Custom Request Handler
A JavaScript function that adds a custom response handler to the request.

**Default:** Empty

```js
const pxConfig = {
  ...
  customRequestHandler: function(pxCtx, pxconfig, req, cb) {
    ...
    cb({body: result, status: 200, statusDescription: "OK", header: {key: 'Content-Type', value:'application/json'}})
  }
  ...
};
```

#### <a name="additionalActivityHandler"></a>Additional Activity Handler
A JavaScript function that allows interaction with the request data collected by PerimeterX before the data is returned to the PerimeterX servers. Does not alter the response.

**Default:** Empty

```javascript
const pxConfig = {
  ...
  additionalActivityHandler: function(pxCtx, request) {
    ...
  }
  ...
};
```
