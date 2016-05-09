'use strict';

const pxCookie = require('./utils/pxcookie');
const pxClient = require('./utils/pxclient');
const pxApi = require('./utils/pxapi');
const pxutil = require('./utils/pxutil');
const pxlogger = require('./utils/pxlogger');

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 0.1 Published 05 April 2016
 */
module.exports.init = initPXModule;
module.exports.verify = verifyUserScore;
module.exports.middleware = pxMiddleware;

/**
 * initPXModule - Initialize PerimeterX middleware.
 *
 * @param {object} params - Configurations object to extend and overwrite the default settings.
 *
 */
function initPXModule(params) {
    require('./pxconfig').init(params);
    pxClient.init();
}

/**
 * verifyUserScore - Verify function, evaluate score by cookie and s2s and make the return an action.
 *
 * @param {Object} pxCtx - current request context.
 *        {string} pxCtx.cookie - user's px cookie.
 *        {string} pxCtx.ip - user's ip address.
 *        {Array} pxCtx.headers - array of user's request headers in a name value format. (example: [{name: 'User-Agent', value: 'PhantomJS'}]
 *        {string} pxCtx.uri - current request uri
 * @param {Function} callback - callback function.
 */
function verifyUserScore(pxCtx, callback) {
    const pxconfig = require('./pxconfig').conf();
    const cookie = pxCtx._px;
    const ip = pxCtx.ip;
    const headers = pxCtx.headers;
    const uri = pxCtx.uri;

    try {
        if (!ip || !headers || !uri) {
            pxlogger.error('perimeterx score evaluation failed. bad parameters.');
            return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
        }
        const userAgent = headers['user-agent'] || headers['User-Agent'] || 'none';

        let action = pxCookie.evalCookie(cookie, ip, userAgent, pxCtx);
        /* score did not cross threshold - pass traffic */
        if (action === pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE) {
            return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
        }

        /* score crossed threshold - block traffic */
        if (action === pxconfig.SCORE_EVALUATE_ACTION.BAD_SCORE) {
            return callback(pxconfig.SCORE_EVALUATE_ACTION.COOKIE_BLOCK_TRAFFIC);
        }

        /* when no fallback to s2s call if cookie does not exist or failed on evaluation */
        pxApi.evalByServerCall(pxCtx, action, (action) => {
            if (action === pxconfig.SCORE_EVALUATE_ACTION.UNEXPECTED_RESULT) {
                pxlogger.error('perimeterx score evaluation failed. unexpected error. passing traffic');
                return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
            }

            if (action === pxconfig.SCORE_EVALUATE_ACTION.GOOD_SCORE) {
                return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
            }

            if (action === pxconfig.SCORE_EVALUATE_ACTION.BAD_SCORE) {
                return callback(pxconfig.SCORE_EVALUATE_ACTION.S2S_BLOCK_TRAFFIC);
            }
        });
    } catch (e) {
        pxlogger.error('perimeterx score evaluation failed. unexpected error. ' + e.message);
        return callback(pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC);
    }
}

/**
 * pxMiddleware - middleware wrapper to score verification.
 *
 * @param {Object} req - HTTP Request.
 * @param {Object} res - HTTP Response.
 * @param {Function} next - callback function.
 */
function pxMiddleware(req, res, next) {
    const pxconfig = require('./pxconfig').conf();

    try {
        const pxCtx = {};
        pxCtx._px = req.cookies ? req.cookies['_px'] : '';
        pxCtx.ip = req.get(pxconfig.IP_HEADER) || req.px_user_ip || req.ip;
        pxCtx.headers = req.headers;
        pxCtx.uri = req.originalUrl || '/';
        pxCtx.full_url = req.protocol + '://' + req.get('host') + req.originalUrl;
        verifyUserScore(pxCtx, (action) => {
            pxlogger.debug('score action ' + action);
            if (action === pxconfig.SCORE_EVALUATE_ACTION.PASS_TRAFFIC) {
                pxClient.sendToPerimeterX('page_requested', {}, pxCtx);
                return next();
            }

            return pxBlock(pxCtx, action, pxconfig.BLOCK_HANDLER, req, res, next);
        });
    } catch (e) {
        return next();
    }
}

/**
 * pxBlock - block handler, send blocking activity to px and render the block html back to screen
 *
 * @param {Object} pxCtx - current request context.
 * @param {Object} action - block cause (cookie/s2s).
 * @param {Function} customHandler - user defined block handler.
 * @param {Object} req - HTTP Request.
 * @param {Object} res - HTTP Response.
 * @param {Function} next - Express next middleware function.
 */
function pxBlock(pxCtx, action, customHandler, req, res, next) {
    const pxconfig = require('./pxconfig').conf();
    let reason = ``;
    if (action === pxconfig.SCORE_EVALUATE_ACTION.COOKIE_BLOCK_TRAFFIC) {
        reason = 'cookie_high_score';
    } else {
        reason = 's2s_high_score';
    }
    pxClient.sendToPerimeterX('block', {
            block_reason: reason,
            block_uuid: pxCtx.block_uuid,
            block_module: 'px-node-express',
            block_score: pxCtx.block_score
        },
        pxCtx
    );

    if (customHandler) {
        req.pxBlockScore = pxCtx.block_score;
        req.pxBlockUuid = pxCtx.block_uuid;

        return customHandler(req, res, next);
    }

    res.writeHead(403, {'Content-Type': 'text/html'});
    res.write(defaultBlockHtmlGenerator(pxCtx));
    res.end();
}

function defaultBlockHtmlGenerator(pxCtx) {
    const ref_str = pxCtx.block_uuid || '';
    const full_url = pxCtx.full_url;

    var html = '<html lang="en">\n<head>\n    <link type="text/css" rel="stylesheet" media="screen, print"\n          href="//fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800">\n    <meta charset="UTF-8">\n    <title>Title</title>\n    <style> p {\n        width: 60%;\n        margin: 0 auto;\n        font-size: 35px;\n    }\n\n    body {\n        background-color: #a2a2a2;\n        font-family: "Open Sans";\n        margin: 5%;\n    }\n\n    img {\n        widht: 180px;\n    }\n\n    a {\n        color: #2020B1;\n        text-decoration: blink;\n    }\n\n    a:hover {\n        color: #2b60c6;\n    } </style>\n    <style type="text/css"></style>\n</head>\n<body cz-shortcut-listen="true">\n<div><img\n        src="http://storage.googleapis.com/instapage-thumbnails/035ca0ab/e94de863/1460594818-1523851-467x110-perimeterx.png">\n</div>\n<span style="color: white; font-size: 34px;">Access to This Page Has Been Blocked</span>\n<div style="font-size: 24px;color: #000042;"><br> Access to ' + full_url + 'is blocked according to the site security policy.\n    <br> Your browsing behaviour fingerprinting made us think you may be a bot. <br> <br> This may happen as a result of\n    the following:\n    <ul>\n        <li>JavaScript is disabled or not running properly.</li>\n        <li>Your browsing behaviour fingerprinting are not likely to be a regular user.</li>\n    </ul>\n    To read more about the bot defender solution: <a href="https://www.perimeterx.com/bot-defender">https://www.perimeterx.com/bot-defender</a>\n    <br> If you think the blocking was done by mistake, contact the site administrator. <br> <br> </br>' + ref_str + '</div>\n</body>\n</html>'
    return html;
}