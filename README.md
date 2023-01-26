[![Build Status](https://travis-ci.org/PerimeterX/perimeterx-node-express.svg?branch=master)](https://travis-ci.org/PerimeterX/perimeterx-node-express)
[![Known Vulnerabilities](https://snyk.io/test/github/PerimeterX/perimeterx-node-express/badge.svg)](https://snyk.io/test/github/PerimeterX/perimeterx-node-express)

![image](https://storage.googleapis.com/perimeterx-logos/primary_logo_red_cropped.png)

# [PerimeterX](http://www.perimeterx.com) Express.js Middleware

> Latest stable version: [v7.4.0](https://www.npmjs.com/package/perimeterx-node-express)

## Table of Contents

-   [Installation](#installation)
-   [Upgrading](#upgrading)
-   [Configuration](#configuration)
    -   [Required Configuration](#requiredConfiguration)
    -   [Optional Configuration](#optionalConfiguration)
        -   [Module Enabled](#moduleEnabled)
        -   [Module Mode](#moduleMode)
        -   [Blocking Score](#blockingScore)
        -   [Send Page Activities](#sendPageActivities)
        -   [Send Block Activities](#sendBlockActivities)
        -   [Logger Severity](#loggerSeverity)
        -   [Sensitive Routes](#sensitiveRoutes)
        -   [Enforced Specific Routes](#enforcedSpecificRoutes)
        -   [Monitored Specific Routes](#monitoredSpecificRoutes)
        -   [Filter By Route](#filterByRoute)
        -   [Sensitive Headers](#sensitiveHeaders)
        -   [IP Headers](#ipHeaders)
        -   [First Party Enabled](#firstPartyEnabled)
        -   [CD First Party Enabled](#CDFirstPartyEnabled)
        -   [Custom Request Handler](#customRequestHandler)
        -   [Additional Activity Handler](#additionalActivityHandler)
        -   [Enrich Custom Parameters](#enrichCustomParams)
        -   [CSS Ref](#cssRef)
        -   [JS Ref](#jsRef)
        -   [Custom Logo](#customLogo)
        -   [Secured PXHD cookie](#securedpxhd)
        -   [Proxy Support](#proxySupport)
        -   [Custom Cookie Header](#customCookieHeader)
        -   [Filter Traffic by User Agent](#filterByUserAgent)
        -   [Filter Traffic by IP](#filterByIP)
        -   [Filter Traffic by HTTP Method](#filterByMethod)
        -   [Test Block Flow on Monitoring Mode](#bypassMonitorHeader)
        -   [CSP Enabled](#cspEnabled)
        -   [CSP Policy Refresh Interval](#cspPolicyRefreshIntervalMinutes)
        -   [CSP Invalidate Policy Interval](#cspNoUpdatesMaxIntervalMinutes)
        -   [Login Credentials Extraction](#loginCredentialsExtraction)
        -   [JWT](#JWT)
-   [Code Defender Middleware - cdMiddleware](#cdMiddleware)
-   [Advanced Blocking Response](#advancedBlockingResponse)
-   [Multiple App Support](#multipleAppSupport)
-   [Additional Information](#additionalInformation)

## <a name="installation"></a> Installation

PerimeterX Express.js middleware is installed via NPM:
`$ npm install --save perimeterx-node-express`

> Please note: As stated in [NodeJS's release schedule](https://github.com/nodejs/Release#release-schedule), NodeJS 6.x is reaching EOL. Thus, support for it will be dropped starting with version 5.0.0.

## <a name="upgrading"></a> Upgrading

To upgrade to the latest Enforcer version, run:

`npm install -s perimeterx-node-express`

For more information, contact [PerimeterX Support](support@perimeterx.com).

## <a name="configuration"></a> Configuration

### <a name="requiredConfiguration"></a> Required Configuration

To use PerimeterX middleware on a specific route follow this example:

```javascript
'use strict';

const express = require('express');
const perimeterx = require('perimeterx-node-express');

const server = express();

/* px-module and cookie parser need to be initiated before any route usage */
const pxConfig = {
    px_app_id: 'PX_APP_ID',
    px_cookie_secret: 'PX_COOKIE_ENCRYPTION_KEY',
    px_auth_token: 'PX_TOKEN',
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

-   The PerimeterX **Application ID / AppId** and PerimeterX **Token / Auth Token** can be found in the Portal, in <a href="https://console.perimeterx.com/botDefender/admin?page=applicationsmgmt" onclick="window.open(this.href); return false;">**Applications**</a>.

-   The PerimeterX **Cookie Encryption Key** can be found in the portal, in <a href="https://console.perimeterx.com/botDefender/admin?page=policiesmgmt" onclick="window.open(this.href); return false;">**Policies**</a>.

    The Policy from where the **Cookie Encryption Key** is taken must correspond with the Application from where the **Application ID / AppId** and PerimeterX **Token / Auth Token**

Setting the PerimeterX middleware on all server's routes:

> When configuring the PerimeterX middleware on all the server's routes, you will have a
> score evaluation on each incoming request. The recommended pattern is to use
> on top of page views routes.

```javascript
'use strict';

const express = require('express');
const perimeterx = require('perimeterx-node-express');

const server = express();

/* the px-module and parser need to be initialized before any route usage */
const pxConfig = {
    px_app_id: 'PX_APP_ID',
    px_cookie_secret: 'PX_COOKIE_ENCRYPTION_KEY',
    px_auth_token: 'PX_TOKEN',
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

## <a name="upgrade"></a> Upgrading

To upgrade to the latest Enforcer version, run:

`npm install -s perimeterx-node-express`

Your Enforcer version is now upgraded to the latest enforcer version.

For more information,contact [PerimeterX Support](support@perimeterx.com).

### <a name="optionalConfiguration"></a>Optional Configuration

In addition to the basic installation configuration [above](#requiredConfiguration), the following configurations options are available:

#### <a name="moduleEnabled"></a>Module Enabled

A boolean flag to enable/disable the PerimeterX Enforcer.

**Default:** true

```js
const pxConfig = {
  ...
  px_module_enabled: false
  ...
};
```

#### <a name="moduleMode"></a>Module Mode

Sets the working mode of the Enforcer.

Possible values:

-   `monitor` - Monitor Mode
-   `active_blocking` - Blocking Mode

**Default:** `monitor`

```js
const pxConfig = {
  ...
  px_module_mode: "monitor"
  ...
};
```

#### <a name="blockingScore"></a>Blocking Score

Sets the minimum blocking score of a request.

Possible values:

-   Any integer between 0 and 100.

**Default:** 100

```js
const pxConfig = {
  ...
  px_blocking_score: 100
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
  px_send_async_activities_enabled: true
  ...
};
```

#### <a name="loggerSeverity"></a>Logger Severity

Sets the logging verbosity level. The available options are:

* `none` - no logs will be generated
* `error` - logs only when severe errors occur, best for production environments
* `debug` - logs more descriptive messages, helpful for analyzing and debugging the enforcer flow

**Default:** error

```js
const pxConfig = {
  ...
  px_logger_severity: 'debug'
  ...
};
```

#### <a name="sensitiveRoutes"></a> Sensitive Routes

An array of route prefixes that trigger a server call to PerimeterX servers every time the page is viewed, regardless of viewing history.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_sensitive_routes: ['/login', '/user/checkout']
  ...
};
```

#### <a name="enforcedSpecificRoutes"></a>Enforced Specific Routes

An array of route prefixes and/or regular expressions that are always validated by the PerimeterX Worker (as opposed to filtered routes).
<br/>A regular expression can be defined using `new RegExp` or directly as an expression, and will be treated as is.
<br/>A string value of a path will be treated as a prefix.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_enforced_routes: ['/home',/^\/$/]
  ...
};
```

#### <a name="monitoredSpecificRoutes"></a>Monitored Specific Routes

An array of route prefixes and/or regular expressions that are always set to be in [monitor mode](#moduleMode). This only takes effect when the module is enabled and in blocking mode.
<br/>A regular expression can be defined using `new RegExp` or directly as an expression, and will be treated as is.
<br/>A string value of a path will be treated as a prefix.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_monitored_routes: ['/home', new RegExp(/^\/$/)]
  ...
};
```

#### <a name="filterByRoute"></a> Filter By Route

An array of route prefixes and/or regular expressions that are always allowed and not validated by the PerimeterX Worker.
<br/>A regular expression can be defined using `new RegExp` or directly as an expression, and will be treated as is.
<br/>A string value of a path will be treated as a prefix.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_filter_by_route: ['/contact-us', /\/user\/.*\/show/]
  ...
};
```

#### <a name="sensitiveHeaders"></a>Sensitive Headers

An array of headers that are not sent to PerimeterX servers on API calls.

**Default:** ['cookie', 'cookies']

```js
const pxConfig = {
  ...
  px_sensitive_headers: ['cookie', 'cookies', 'x-sensitive-header']
  ...
};
```

#### <a name="ipHeaders"></a>IP Headers

An array of trusted headers that specify an IP to be extracted.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_ip_headers: ['x-user-real-ip']
  ...
};
```

#### <a name="firstPartyEnabled"></a>First Party Enabled

A boolean flag to enable/disable first party mode.

**Default:** true

```js
const pxConfig = {
  ...
  px_first_party_enabled: false
  ...
};
```

#### <a name="CDFirstPartyEnabled"></a>CD First Party Enabled

A boolean flag to enable/disable Code Defender first party mode.

**Default:** false

```js
const pxConfig = {
  ...
  px_cd_first_party_enabled: false
  ...
};
```

#### <a name="customRequestHandler"></a>Custom Request Handler

A JavaScript function that adds a custom response handler to the request.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_custom_request_handler: function(pxCtx, pxconfig, req, cb) {
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
  px_additional_activity_handler: function(pxCtx, request) {
    ...
  }
  ...
};
```

#### <a name="enrichCustomParams"></a>Enrich Custom Parameters

With the `px_enrich_custom_parameters` function you can add up to 10 custom parameters to be sent back to PerimeterX servers. When set, the function is called before seting the payload on every request to PerimetrX servers. The parameters should be passed according to the correct order (1-10).

**Default:** Empty

```javascript
const pxConfig = {
  ...
  px_enrich_custom_parameters: function(customParams, originalRequest) {
    customParams["custom_param1"] = "yay, test value";
    return customParams;
  }
  ...
};
```

#### <a name="cssRef"></a>CSS Ref

Modifies a custom CSS by adding the CSSRef directive and providing a valid URL to the CSS.

**Default:** Empty

```javascript
const pxConfig = {
  ...
  px_css_ref: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css'
  ...
};
```

#### <a name="jsRef"></a>JS Ref

Adds a custom JS file by adding JSRef directive and providing the JS file that is loaded with the block page.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_js_ref: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js'
  ...
};
```

#### <a name="customLogo"></a>Custom Logo

The logo is displayed at the top of the the block page.
Max-height = 150px, Width = auto.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_custom_logo: 'https://s.perimeterx.net/logo.png',
  ...
};
```

#### <a name="securedpxhd"></a>Secured PXHD cookie

A boolean flag to enable/disable the `Secure` flag when baking a PXHD cookie.

**Default:** false

```js
const pxConfig = {
  ...
  px_pxhd_secure: true
  ...
};
```

#### <a name="proxySupport"></a>Proxy Support

Allows traffic to pass through a http proxy server.

**Default:** Empty

```javascript
const pxConfig = {
  ...
  px_proxy_url: 'https://localhost:8008',
  ...
};
```

#### <a name="customCookieHeader"></a>Custom Cookie Header

When set, instead of extrating the PerimeterX Cookie from the `Cookie` header, this property specifies a header name that will contain the PerimeterX Cookie.

**Default:** Empty

```javascript
const pxConfig = {
  ...
  px_custom_cookie_header: "x-px-cookies"
  ...
};
```

#### <a name="filterByUserAgent"></a> Filter Traffic by User Agent

An array of user agent constants and/or regular expressions that are always filtered and not validated by the PerimeterX middleware.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_filter_by_user_agent: ['testUserAgent/v1.0', /test/]
  ...
};
```

#### <a name="filterByIP"></a> Filter Traffic by IP

An array of IP ranges / IP addresses that are always filtered and not validated by the PerimeterX middleware.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_filter_by_ip: ['192.168.10.0/24', '192.168.2.2']
  ...
};
```

#### <a name="filterByMethod"></a> Filter Traffic by HTTP Method

An array of HTTP methods that are always filtered and not validated by the PerimeterX middleware.

**Default:** Empty

```js
const pxConfig = {
  ...
  px_filter_by_http_method: ['options']
  ...
};
```

#### <a name=“bypassMonitorHeader”></a> Test Block Flow on Monitoring Mode

Allows you to test an enforcer’s blocking flow while you are still in Monitor Mode.

When the header name is set(eg. `x-px-block`) and the value is set to `1`, when there is a block response (for example from using a User-Agent header with the value of `PhantomJS/1.0`) the Monitor Mode is bypassed and full block mode is applied. If one of the conditions is missing you will stay in Monitor Mode. This is done per request.
To stay in Monitor Mode, set the header value to `0`.

The Header Name is configurable using the `px_bypass_monitor_header` property.

**Default:** Empty

```javascript
const pxConfig = {
  ...
  px_bypass_monitor_header: "x-px-block"
  ...
};
```

#### <a name=“cspEnabled”></a> CSP Enabled

Used in `cdMiddleware` - Code Defender's middleware. Enable enforcement of CSP header policy on responses retured to the client (only if active CSP policy exists in PerimeterX for the specific appId). 

**Default:** false

```javascript
const pxConfig = {
  ...
  px_csp_enabled: false
  ...
};
```

#### <a name=“cspPolicyRefreshIntervalMinutes”></a> CSP Policy Refresh Interval

Used by `cdMiddleware` - Code Defender's middleware. Sets the interval, in minutes, to fetch and update the active CSP policy for the specific appId from PerimeterX. 

**Default:** 5

```javascript
const pxConfig = {
  ...
  px_csp_policy_refresh_interval_minutes: 5
  ...
};
```

#### <a name=“cspNoUpdatesMaxIntervalMinutes”></a> CSP Invalidate Policy Interval

Used by `cdMiddleware` - Code Defender's middleware. Invalidates active CSP policy after specified number of minutes with no updates received from PerimeterX. 

**Default:** 60

```javascript
const pxConfig = {
  ...
  px_csp_no_updates_max_interval_minutes: 60
  ...
};
```

#### <a name="loginCredentialsExtraction"></a>Login Credentials Extraction

This feature extracts credentials (hashed username and password) from requests and sends them to PerimeterX as additional info in the risk api call. The feature can be toggled on and off, and may be set for any number of unique paths.

If credentials are found to be compromised, the header `px-compromised-credentials` will be added to the request with the value `1`. You may configure the name of this header with the `px_compromised_credentials_header` configuration.

> Note: This feature requires access to the request body as a either an `object` or a `string` type.

**Default Values**

px_compromised_credentials_header: "px-compromised-credentials"

px_login_credentials_extraction_enabled: false

px_login_credentials_extraction: Empty

```javascript
const pxConfig = {
  ...
  px_compromised_credentials_header: "x-px-comp-creds",
  px_login_credentials_extraction_enabled: true,
  px_login_credentials_extraction: [
    {
      path: "/login", // login path
      method: "post", // supported values: post
      sent_through: "body", // supported values: body, header, query-param
      pass_field: "password", // name of the password field in the request
      user_field: "username" // name of the username field in the request
    },
    ...
  ],
  ...
};

```

It is also possible to define a custom callback to extract the username and password. The function should accept the request object as
a parameter and return an object with the keys `user` and `pass`. If extraction is unsuccessful, the function should return `null`.

```javascript
const pxConfig = {
    ...
    px_login_credentials_extraction_enabled: true,
    px_login_credentials_extraction: [{
        path: "/login", // login path, automatically added to sensitive routes
        method: "post", // supported values: post
        callback: (req) => {
            // custom implementation resulting in variables username and password
            if (username && password) {
                return { "user": username, "pass": password };
            } else {
                return null;
            }
        }
    }]
};
```

#### <a name="JWT"></a>JWT

Enable the extraction of JWT fields from requests and adding them to the risk, page requested and block activities.

px_jwt_cookie_name

The cookie name that should contain the JWT token.

**Default:** ""

px_jwt_cookie_user_id_field_name

The field name in the JWT object, extracted from the JWT cookie, that contains the user ID to be extracted

**Default:** ""

px_jwt_cookie_additional_field_names

The field names in the JWT object, extracted from the JWT cookie, that should be extracted in addition to the user ID.

**Default:** []

px_jwt_header_name

The header name that should contain the JWT token.

**Default:** ""

px_jwt_header_user_id_field_name

The field name in the JWT object, extracted from the JWT header, that contains the user ID to be extracted

**Default:** ""

px_jwt_header_additional_field_names

The field names in the JWT object, extracted from the JWT header, that should be extracted in addition to the user ID.

**Default:** []

```javascript
const pxConfig = {
  ...
    "px_jwt_cookie_name":  "auth",
    "px_jwt_cookie_user_id_field_name": "nameID",
    "px_jwt_cookie_additional_field_names": ["exp", "iss"],
    "px_jwt_header_name":  "authorization",
    "px_jwt_header_user_id_field_name": "sub",
    "px_jwt_header_additional_field_names": ["jti"]
  ...
};
```

### <a name="additional-s2s-activity"></a> Additional S2S Activity

To enhance detection on login credentials extraction endpoints, the following additional information is sent to PerimeterX
via an `additional_s2s` activity:

* __Response Code__ - The numerical HTTP status code of the response. This is sent automatically.
* __Login Success__ - A boolean indicating whether the login completed successfully. See the options listed below for how to provide this data.
* __Raw Username__ - The original username used for the login attempt. In order to report this information, make sure the configuration `px_send_raw_username_on_additional_s2s_activity` is set to `true`.

By default, this `additional_s2s` activity is sent automatically. If it is preferable to send this activity manually,
it's possible to disable automatic sending by configuring the value of `px_automatic_additional_s2s_activity_enabled` to `false`.

**Default Value*: true

```javascript
const pxConfig = {
    ...
    px_automatic_additional_s2s_activity_enabled: false
    ...
}
```

The activity can then be sent manually by invoking the function `sendAdditionalS2SActivity()`. The function accepts three
arguments: the original HTTP request, the status code, and a boolean indicating the login successful status.

```javascript
const perimeterx = require('perimeterx-node-express');
const pxConfig = {
    px_app_id: '<APP_ID>',
    // ...
};
pxInstance = perimeterx.new(pxConfig);

app.use(pxInstance.middleware);

app.post('/login', (req, res) => {
   // login flow resulting in boolean isLoginSuccessful
    res.status(200).json({ successful: isLoginSuccessful });
    pxInstance.sendAdditionalS2SActivity(req, res.statusCode, isLoginSuccessful);
});
```

#### Login Success Reporting

There are a number of different possible ways to report the success or failure of the login attempt. If left empty, the
login successful status will always be reported as `false`.

**Default**: Empty

```javascript
const pxConfig = {
    ...
    px_login_successful_reporting_method: 'status' // supported values: status, header, body, custom
    ...
}
```

__Status__

Provide a status or array of statuses that represent a successful login. If a response's status code matches the provided
value or one of the values in the provided array, the login successful status is set to `true`. Otherwise, it's set to `false`.

> Note: To define a range of statuses, use the `custom` reporting method.

**Default Values**

px_login_successful_status: 200

```javascript
const pxConfig = {
    ...
    px_login_successful_reporting_method: 'status',
    px_login_successful_status: [200, 202] // number or array of numbers
    ...
}
```

__Header__

Provide a header name and value. If the header exists on the response and matches the provided value, the login successful
status is set to `true`. If the header is not found on the response, or if the header value does not match the value in the
configuration, the login successful status is set to `false`.

**Default Values**

px_login_successful_header_name: x-px-login-successful

px_login_successful_header_value: 1

```javascript
const pxConfig = {
    ...
    px_login_successful_reporting_method: 'header',
    px_login_successful_header_name: 'login-successful',
    px_login_successful_header_value: 'true'
    ...
}
```

__Body__

Provide a string or regular expression with which to parse the response body. If a match is found, the login successful
status is set to `true`. If no match is found, the login successful status is set to `false`.

**Default Values**

px_login_successful_body_regex: Empty

```javascript
const pxConfig = {
    ...
    px_login_successful_reporting_method: 'body',
    px_login_successful_body_regex: 'You logged in successfully!' // string or RegExp
    ...
}
```

__Custom__

Provide a custom callback that returns a boolean indicating if the login was successful.

**Default Values**
px_login_successful_custom_callback: null

```javascript
const pxConfig = {
    ...
    px_login_successful_reporting_method: 'custom',
    px_login_successful_custom_callback: (response) => {
        return response && response.locals && response.locals.isLoginSuccessful;
    }
    ...
}
```

#### Raw Username

When enabled, the raw username used for logins on login credentials extraction endpoints will be reported to PerimeterX
if (1) the credentials were identified as compromised, and (2) the login was successful as reported via the property above.

**Default**: false

```javascript
const pxConfig = {
    ...
    px_send_raw_username_on_additional_s2s_activity: true
    ...
}
```

## <a name="cdMiddleware"></a> Code Defender Middleware - cdMiddleware

Code Defender's middleware to handle the enforcement of CSP headers on responses returned to the client.
The express module is in charge of communicating with PerimeterX to receive and maintain the latest CSP policy for the given appId.
It also maintains the policy state and invalidates the policy when communication with PerimeterX's Enforcer Data Provider is lost, base on the configuration values (`px_csp_no_updates_max_interval_minutes`, `px_csp_policy_refresh_interval_minutes`).

It then uses **PerimeterX Node Core** module to enforce the actual functionality adding the necessary CSP header to the response object.

usage example:
```javascript
const perimeterx = require('perimeterx-node-express');
...
const pxInstance = perimeterx.new(pxConfig);
app.use(pxInstance.cdMiddleware);
...
```

### Adding Nonce value to CSP header

The PerimeterX Express module allows adding a Nonce value to the CSP header.
To do this, use the module's static function `addNonce`.
After PerimeterX cdMiddleware has added the CSP header to the response, call the `addNonce` function,
passing in the response object and a nonce value (string consisting of alphanumeric characters).
If a CSP header exists on the response object, the function will alter the header by adding the nonce value in the correct place.
The function does not return a value, but rather changes the original response.
```javascript
const perimeterx = require('perimeterx-node-express');
...
perimeterx.addNonce(response, 'rAnd0mNon6e');
...
```
> Please note: the nonce value must be unique for each HTTP response.
> For further explanation, refer to the official documentation of [CSP nonce](https://content-security-policy.com/nonce/).


## <a name="advancedBlockingResponse"></a> Advanced Blocking Response

In special cases, (such as XHR post requests) a full Captcha page render might not be an option. In such cases, using the Advanced Blocking Response returns a JSON object continaing all the information needed to render your own Captcha challenge implementation, be it a popup modal, a section on the page, etc. The Advanced Blocking Response occurs when a request contains the _Accept_ header with the value of `application/json`. A sample JSON response appears as follows:

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
window._pxOnCaptchaSuccess = function (isValid) {
    if (isValid) {
        alert('yay');
    } else {
        alert('nay');
    }
};
```

For details on how to create a custom Captcha page, refer to the [documentation](https://docs.perimeterx.com/pxconsole/docs/customize-challenge-page)

> If you wish to disable this behavior when the _Accept_ header has the value of `application/json`, set the following configuration:
>
> ```javascript
> const pxConfig = {
>   ...
>   px_advanced_blocking_response_enabled: false
>   ...
> };
> ```

## <a name="multipleAppSupport"></a> Multiple App Support

If you use two different apps on the same node runtime, you can create two instances and use them on two routes:

```javascript
'use strict';

const express = require('express');
const perimeterx = require('perimeterx-node-express');

const server = express();

/* the px-module and parser need to be initialized before any route usage */
const pxConfig1 = {
    px_app_id: 'PX_APP_ID_1',
    px_cookie_secret: 'PX_COOKIE_ENCRYPTION_KEY',
    px_auth_token: 'PX_TOKEN_1',
};
const middlewareApp1 = perimeterx.new(pxConfig1).middleware;
const app1Router = express.Router();
app1Router.use(middlewareApp1);
app1Router.get('/hello', (req, res) => {
    res.send('Hello from App1');
});
server.use('/app1', app1Router);

const pxConfig2 = {
    px_app_id: 'PX_APP_ID_2',
    px_cookie_secret: 'PX_COOKIE_ENCRYPTION_KEY',
    px_auth_token: 'PX_TOKEN_2',
};
const middlewareApp2 = perimeterx.new(pxConfig2).middleware;
const app2Router = express.Router();
app2Router.use(middlewareApp2);
app2Router.get('/app2', (req, res) => {
    res.send('Hello from App2');
});
server.use('/app2', app1Router);

server.listen(8081, () => {
    console.log('server started');
});
```

## <a name=“additionalInformation”></a> Additional Information

### URI Delimiters

PerimeterX processes URI paths with general- and sub-delimiters according to RFC 3986. General delimiters (e.g., `?`, `#`) are used to separate parts of the URI. Sub-delimiters (e.g., `$`, `&`) are not used to split the URI as they are considered valid characters in the URI path.

## Thanks
