# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.7.0] - 2016-11-30
### Added
- Page UUID added to Risk API requests

### Modified
- Cookie to store page UUID

## [1.6.3] - 2016-09-20
### Added
- Module version added to risk calls.
- Cookie value when relevant.
- HTTP-VERSION & HTTP-METHOD into Server to Server queries.
- License file.
- VID to server activities.
- Filter seneitive headers.
- Configuration unit tests.
- Extract visitor IP by function.


### Modified
- Remastered context object.
- Changed logo image.
- Upgraded ExpressJS.
- Server to Server - new Enums.
- Collector URL change to sapi.net
- Stopped sending page_requested activities for risk_api calls.

### Fixed
- Block page URI display.
- User IP and custom block handler.


## [1.4] - 2016-05-29
### Added
- CAPTCHA Configurable.
- VID to risk requests.
- CAPTCHA util to make captcha validation call with PerimeterX servers.
- Support for vid cookie signing.

### Modified
- VID as part of cookie signing.
- Refactored HTTP client to use single client for all type of calls.

### Fixed
- Missing URI on incoming requests.
- Keep-Alive agent to work with local tests.
- Format invalid cookie error to be printed correctly.
- Missing agent referer.

[1.6.3]: https://github.com/PerimeterX/perimeterx-node-express/releases/tag/v1.6.3
[1.4]: https://github.com/PerimeterX/perimeterx-node-express/releases/tag/v1.4