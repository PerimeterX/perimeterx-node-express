# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [6.8.2] - 2021-07-04

### Fixed

-   Cookie decryption fails on mobile sdk error

## [6.8.0] - 2021-06-08

### Added

-   New middleware for Code Defender (cdMiddleware) to support CSP enforcement

## [6.7.0] - 2021-04-07

### Added

-   Support for regular expressions in filter by user agent

## [6.6.0] - 2021-02-09

### Added

-   Support for `customCookieHeader`.
-   Support for custom log.

## [6.5.4] - 2020-10-25

### Fixed

-   Support for `ACTIVITIES_TIMEOUT_MS`.

## [6.5.3] - 2020-04-21

### Added

-   New config to support `Secure` flag for pxhd cookie

## [6.5.2] - 2020-02-11

### Fixed

-   Custom parameters for async activities.

## [6.5.1] - 2020-02-11

### Fixed

-   Support for `originalRequest` in `enrichCustomParameters`.

## [6.5.0] - 2019-11-26

### Added

-   Support for filtering traffic by http method

## [6.4.0] - 2019-11-26

### Added

-   Support for regex in enforced/whitelisted/monitored specific routes.
-   Support for filtering traffic by IPs/CIDRs.
-   Support for filtering traffic by user agents.

## [6.3.1] - 2019-11-19

### Fixed

-   cssRef, jsRef to accept string values

## [6.3.0] - 2019-10-24

### Added

-   Send HTTP method on async activities
-   Support for specific enforced routes and specific monitored routes

### Fixed

-   Upgraded dependency

## [6.2.1] - 2019-10-02

### Fixed

-   Dependency upgrading

## [6.2.0] - 2019-05-24

### Added

-   send telemetry by command

### Fixed

-   timeout error handling for api calls

## [6.1.1] - 2019-05-02

### Fixed

-   pxConfig setting for proxy
-   Risk API timeout check

## [6.1.0] - 2019-03-19

### Added

-   Support for loading configuration from a file.
-   Advanced Blocking Response

### Changed

-   Updated perimeterx-node-core dependency to version ~2.1.0.

## [6.0.0] - 2019-03-11

### Added

-   Support multiple instances of the enforcer using the `new` method.

### Changed

-   PxClient now requires a config as an argument for the init function.
-   Updated perimeterx-node-core dependency to version ~2.0.0.

## [5.1.0] - 2019-02-25

### Added

-   Support for testing blocking flow in monitor mode

## [5.0.0] - 2018-01-11

### Added

-   Full refactor of proxy support

### Fixed

-   Lowercasing of json response
-   Various PXHD related issues

### Removed

-   **Breaking Change**: Dropped support for NodeJS 6.x

## [4.0.0] - 2018-01-02

### Added

-   Added PXHD handling
-   Added async custom params
-   Added data enrichment cookie handling
-   Added Proxy support

## [3.5.0] - 2018-10-29

### Fixed

-   px_cookie_hmac was missing from risk api calls
-   First party captcha fallback

### Added

-   Configurable testing mode
-   New call reason 'no_cookie_key'

## [3.4.2] - 2018-10-02

### Fixed

-   Updated dev dependencies

## [3.4.1] - 2018-08-09

### Fixed

-   Various fixes for request module and error handling

## [3.4.0] - 2018-07-11

### Fixed

-   Refactored request module

## [3.3.0] - 2018-06-10

### Added

-   Added support for Advanced Blocking Response

## [3.2.1] - 2018-02-28

### Fixed

-   Not returning response on error

## [3.2.0] - 2018-02-19

### Modified

-   Updated required core package version

## [3.1.1] - 2018-01-24

### Modified

-   Stability related fixes

## [3.1.0] - 2018-01-22

### Added

## [3.1.0] - 2018-01-22

### Added

-   First party support

## [3.0.1] - 2017-12-24

### Modified

-   Restructured code to use shared core package
-   Enhanced module logs

### Added

-   Mobile SDK support
-   Remote configurations
-   Enforcer telemetry
-   Support FunCaptcha
-   New configuration - moduleMode

## [1.9.0] - 2017-06-08

### Added

-   Support for cookie v3 & risk v2
-   Sending orig_px_cookie when decrypt fails
-   Added support JS challenge
-   Sensitive routes, triggers risk_api

## [1.8.0] - 2017-03-24

### Added

-   Sending px cookie on page requested activities
-   Redesigned block pages
-   Change perimeterx servers url to be per app id

## [1.7.0] - 2016-11-30

### Added

-   Page UUID added to Risk API requests

### Modified

-   Cookie to store page UUID

## [1.6.3] - 2016-09-20

### Added

-   Module version added to risk calls.
-   Cookie value when relevant.
-   HTTP-VERSION & HTTP-METHOD into Server to Server queries.
-   License file.
-   VID to server activities.
-   Filter seneitive headers.
-   Configuration unit tests.
-   Extract visitor IP by function.

### Modified

-   Remastered context object.
-   Changed logo image.
-   Upgraded ExpressJS.
-   Server to Server - new Enums.
-   Collector URL change to sapi.net
-   Stopped sending page_requested activities for risk_api calls.

### Fixed

-   Block page URI display.
-   User IP and custom block handler.

## [1.4] - 2016-05-29

### Added

-   CAPTCHA Configurable.
-   VID to risk requests.
-   CAPTCHA util to make captcha validation call with PerimeterX servers.
-   Support for vid cookie signing.

### Modified

-   VID as part of cookie signing.
-   Refactored HTTP client to use single client for all type of calls.

### Fixed

-   Missing URI on incoming requests.
-   Keep-Alive agent to work with local tests.
-   Format invalid cookie error to be printed correctly.
-   Missing agent referer.

[1.6.3]: https://github.com/PerimeterX/perimeterx-node-express/releases/tag/v1.6.3
[1.4]: https://github.com/PerimeterX/perimeterx-node-express/releases/tag/v1.4
