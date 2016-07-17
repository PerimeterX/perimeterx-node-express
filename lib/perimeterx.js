'use strict';

const pxClient = require('./utils/pxclient');
const pxlogger = require('./utils/pxlogger');

/**
 * PerimeterX (http://www.perimeterx.com) NodeJS-Express SDK
 * Version 1.0 Published 12 May 2016
 */
module.exports.init = initPXModule;
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
 * pxMiddleware - middleware wrapper to score verification.
 *
 * @param {Object} req - HTTP Request.
 * @param {Object} res - HTTP Response.
 * @param {Function} next - callback function.
 */
function pxMiddleware(req, res, next) {
    const pxconfig = require('./pxconfig').conf();
    const pxutil = require('./utils/pxutil');
    const pxCaptcha = require('./utils/pxcaptcha');

    if (!pxconfig.ENABLE_MODULE || pxutil.checkForStatic(req, pxconfig.STATIC_FILES_EXT)) {
        return next();
    }

    try {
        const pxCtx = pxutil.getPxContext(req, pxconfig);
        if (req.cookies && req.cookies['_pxCaptcha']) {
            const pxcptch = req.cookies['_pxCaptcha'];
            res.clearCookie('_pxCaptcha', {});
            pxCaptcha.verifyCaptcha(pxCtx, pxcptch, (err, result) => {
                if (err) {
                    pxlogger.error('error while evaluation perimeterx captcha');
                    return pxBlock(pxCtx, pxconfig.SCORE_EVALUATE_ACTION.CAPTCHA_BLOCK_TRAFFIC, pxconfig.BLOCK_HANDLER, req, res, next);
                }

                if (!result || result.status == -1) {
                    pxlogger.debug('perimeterx captcha verification faild');
                    return pxBlock(pxCtx, pxconfig.SCORE_EVALUATE_ACTION.CAPTCHA_BLOCK_TRAFFIC, pxconfig.BLOCK_HANDLER, req, res, next);
                }

                return next();
            });
        } else {
            pxutil.verifyUserScore(pxCtx, (action) => {
                pxlogger.debug('score action ' + action);
                if (action === pxconfig.SCORE_EVALUATE_ACTION.COOKIE_PASS_TRAFFIC) {
                    pxlogger.debug('sending page requested activity');
                    pxClient.sendToPerimeterX('page_requested', {}, pxCtx);
                    return next();
                }

                if (action === pxconfig.SCORE_EVALUATE_ACTION.S2S_PASS_TRAFFIC) {
                    return next();
                }

                return pxBlock(pxCtx, action, pxconfig.BLOCK_HANDLER, req, res, next);
            });
        }
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

    switch (action) {
        case pxconfig.SCORE_EVALUATE_ACTION.COOKIE_BLOCK_TRAFFIC:
        {
            reason = 'cookie_high_score';
            break
        }
        case pxconfig.SCORE_EVALUATE_ACTION.S2S_BLOCK_TRAFFIC:
        {
            reason = 's2s_high_score';
            break;
        }
        case pxconfig.SCORE_EVALUATE_ACTION.CAPTCHA_BLOCK_TRAFFIC:
        {
            reason = 'captcha_verification_failed';
            break;
        }
    }
    pxlogger.debug('sending block activity');
    pxClient.sendToPerimeterX('block', {
            block_reason: reason,
            client_uuid: pxCtx.block_uuid,
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
    if (pxconfig.CAPTCHA_ENABLED) {
        res.write(captchaBlockHtmlGenerator(pxCtx));
    } else {
        res.write(defaultBlockHtmlGenerator(pxCtx));
    }

    res.end();
}

function defaultBlockHtmlGenerator(pxCtx) {
    const ref_str = pxCtx.block_uuid || '';
    const full_url = pxCtx.full_url;

    var html = '<html lang="en">\n<head>\n    <link type="text/css" rel="stylesheet" media="screen, print"\n          href="//fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800">\n    <meta charset="UTF-8">\n    <title>Access to This Page Has Been Blocked</title>\n    <style> p {\n        width: 60%;\n        margin: 0 auto;\n        font-size: 35px;\n    }\n\n    body {\n        background-color: #a2a2a2;\n        font-family: "Open Sans";\n        margin: 5%;\n    }\n\n    img {\n        widht: 180px;\n    }\n\n    a {\n        color: #2020B1;\n        text-decoration: blink;\n    }\n\n    a:hover {\n        color: #2b60c6;\n    } </style>\n    <style type="text/css"></style>\n</head>\n<body cz-shortcut-listen="true">\n<div><img\n        src="http://storage.googleapis.com/instapage-thumbnails/035ca0ab/e94de863/1460594818-1523851-467x110-perimeterx.png">\n</div>\n<span style="color: white; font-size: 34px;">Access to This Page Has Been Blocked</span>\n<div style="font-size: 24px;color: #000042;"><br> Access to ' + full_url + 'is blocked according to the site security policy.\n    <br> Your browsing behaviour fingerprinting made us think you may be a bot. <br> <br> This may happen as a result of\n    the following:\n    <ul>\n        <li>JavaScript is disabled or not running properly.</li>\n        <li>Your browsing behaviour fingerprinting are not likely to be a regular user.</li>\n    </ul>\n    To read more about the bot defender solution: <a href="https://www.perimeterx.com/bot-defender">https://www.perimeterx.com/bot-defender</a>\n    <br> If you think the blocking was done by mistake, contact the site administrator. <br> <br>\n\n    <span style="font-size: 20px;">Block Reference: <span\n            style="color: #525151;">#' + ref_str + '</span></span></div>\n</body>\n</html>'
    return html;
}

function captchaBlockHtmlGenerator(pxCtx) {
    const ref_str = pxCtx.block_uuid || '';
    const full_url = pxCtx.full_url;

    var html = '<html lang="en">\n<head>\n    <link type="text/css" rel="stylesheet" media="screen, print"\n          href="//fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,300,600,700,800">\n    <meta charset="UTF-8">\n    <title>Access to This Page Has Been Blocked</title>\n    <style> p {\n        width: 60%;\n        margin: 0 auto;\n        font-size: 35px;\n    }\n\n    body {\n        background-color: #a2a2a2;\n        font-family: "Open Sans";\n        margin: 5%;\n    }\n\n    img {\n        widht: 180px;\n    }\n\n    a {\n        color: #2020B1;\n        text-decoration: blink;\n    }\n\n    a:hover {\n        color: #2b60c6;\n    } </style>\n    <style type="text/css"></style>\n    <script src=\'https://www.google.com/recaptcha/api.js\'></script>\n    <script>\n        window.px_vid = "' + pxCtx.px_vid + '" ; \n        function handleCaptcha(response) {\n            var name = \'_pxCaptcha\';\n            var expiryUtc = new Date( Date.now() + 1000 * 10 ).toUTCString();\n            var cookieParts = [name, \'=\', response + \':\' + window.px_vid, \'; expires=\', expiryUtc, \'; path=/\'];\n            document.cookie = cookieParts.join(\'\');\n            location.reload();\n        }\n    </script>\n</head>\n<body cz-shortcut-listen="true">\n<div><img\n        src="http://storage.googleapis.com/instapage-thumbnails/035ca0ab/e94de863/1460594818-1523851-467x110-perimeterx.png">\n</div>\n<span style="color: white; font-size: 34px;">Access to This Page Has Been Blocked</span>\n<div style="font-size: 24px;color: #000042;"><br> Access to ' + full_url + 'is blocked according to the site security policy.\n    <br> Your browsing behaviour fingerprinting made us think you may be a bot. <br> <br> This may happen as a result of\n    the following:\n    <ul>\n        <li>JavaScript is disabled or not running properly.</li>\n        <li>Your browsing behaviour fingerprinting are not likely to be a regular user.</li>\n    </ul>\n    To read more about the bot defender solution: <a href="https://www.perimeterx.com/bot-defender">https://www.perimeterx.com/bot-defender</a>\n    <br> If you think the blocking was done by mistake, contact the site administrator. <br> <br><div class="g-recaptcha" data-sitekey="6Lcj-R8TAAAAABs3FrRPuQhLMbp5QrHsHufzLf7b" data-callback="handleCaptcha" data-theme="dark"></div>\n\n    <span style="font-size: 20px;">Block Reference: <span\n            style="color: #525151;">#' + ref_str + '</span></span></div>\n</body>\n</html>'
    return html;
}
