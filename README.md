![image](https://843a2be0f3083c485676508ff87beaf088a889c0-www.googledrive.com/host/0B_r_WoIa581oY01QMWNVUElyM2M)

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
  *   [Extracting Real IP Address](#real-ip)
  *   [API Timeout Milliseconds](#api-timeout)
  *   [Send Page Activities](#send-page-activities)
  *   [Debug Mode](#debug-mode)
  *   [Unit Tests](#unit-tests)
-   [Contributing](#contributing)

<a name="Usage"></a>

<a name="dependencies"></a> Dependencies
----------------------------------------

-   [cookie-parser](https://github.com/expressjs/cookie-parser)

<!-- -->

    $ npm install --save cookie-parser

<a name="installation"></a> Installation
----------------------------------------

    $ npm install --save perimeterx-node-express

### <a name="basic-usage"></a> Basic Usage Example

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

#### <a name="configuration"></a> Configuration Options

##### Configuring Required Parameters

Configuration options are set in `pxConfig`

Required parameters:

-   pxAppid
-   cookieSecretKey
-   authToken

##### <a name="blocking-score"></a> Changing the Minimum Score for Blocking

**default:** 70

      const pxConfig = {
          blockingScore: 75
      }

##### <a name="custom-block"></a> Custom Blocking Actions

Setting a custom block handler customizes the action that is taken when
a user visits with a high score. Common customizations are to present a
reCAPTHA or custom branded block page.

**default:** pxBlockHandler - return HTTP status code 403 and serve the
Perimeterx block page.

      function customBlockHandler(req, res, next)
      {
          const block_score = req.block_score;
          const block_uuid = req.block_uuid;

          /* user defined logic comes here */
      }

      const pxConfig = {
          blockHandler: customBlockHandler
      }

###### Examples

**Serve a Custom HTML Page**

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

**Do Not Block, Monitor Only**

    function customBlockHandler(req, res, next) {
        const block_score = req.block_score;
        const block_uuid = req.block_uuid;

        /* user defined logic comes here */
        
        return next()
    }

    const pxConfig = {
        blockHandler: customBlockHandler
    }

##### <a name="real-ip"></a>Extracting the Real User IP Address From HTTP Headers

In order to evaluate user's score properly, the PerimeterX module
requires the real socket ip (client IP address that created the HTTP
request). The user ip can be passed to the PerimeterX module using an
HTTP header or by enriching the request object.

**default with no predefined header:** `req.ip`

**default header**: `px-user-ip`

      /* user ip retrieved in PerimeterX module */
      const userIp = req.get(pxConfig.IP_HEADER) || req.px_user_ip || req.ip;

      const pxConfig = {
        ipHeader: 'X-Forwarded-For'
      }

##### <a name="api-timeout"></a>API Timeout Milliseconds

Timeout in millisceonds to wait for the PerimeterX server API response.
The API is called when the risk cookie does not exist, or is expired or
invalid.

**default:** 1000

      const pxConfig = {
        apiTimeoutMS: 1500
      }

##### <a name="send-page-activities"></a> Send Page Activities

Boolean flag to enable or disable sending activities and metrics to
PerimeterX on each page request. Enabling this feature will provide data
that populates the PerimeterX portal with valuable information such as
amount requests blocked and API usage statistics.

**default:** false

      const pxConfig = {
        sendPageActivities: true
      }

##### <a name="debug-mode"></a> Debug Mode

Enables debug logging

**default:** false

      const pxConfig = {
        debugMode: true
      }

##### <a name="unit-tests"></a> Unit Tests

    $ TEST_VERBOSE=true/false mocha

> Note: running tests without a valid PerimeterX app id, auth token and
> cookie key will not work.

<a name="contributing"></a> Contributing
----------------------------------------

By forking the repository and changing your configurations on
`tests/utils/test.util.js` you can easily setup a development kit.
