'use strict';
const request = require('request');
const _ = require('lodash');
const pxlogger = require('./pxlogger');
const pxconfig = require('../pxconfig').conf();

exports.init = initClient;
exports.sendToPerimeterX = sendToPerimeterX;

let activitiesBuffer = [];

/**
 * initClient - initialize activities client timer to flash activities once a second
 *
 */
function initClient() {
    setInterval(() => {
        if (activitiesBuffer.length) {
            submitActivities();
        }
    }, 1000);
}

/**
 * sendToPerimeterX - batching the activities on the activities buffer and flash it if reached threshold
 *
 * @param {string} activity_type - name of the activity
 * @param {object} details - activities details in key-val format
 * @param {object} pxCtx - request context
 */
function sendToPerimeterX(activity_type, details, pxCtx) {
    if (activity_type == 'page_requested' && !pxconfig.SEND_PAGE_ACTIVITIES) {
        return;
    }
    const pxData = {};
    pxData.type = activity_type;
    pxData.headers = pxCtx.headers;
    pxData.timestamp = Date.now();
    pxData.socket_ip = pxCtx.ip;
    pxData.px_app_id = pxconfig.PX_APP_ID;
    pxData.details = details;

    activitiesBuffer.push(pxData);
    if (activitiesBuffer.length > pxconfig.MAX_BUFFER_LEN) {
        submitActivities()
    }
}

/**
 * submitActivities - flash activities buffer and send to px servers for processing
 *
 */
function submitActivities() {
    pxlogger.debug('Sending activities to perimeterx servers');

    const tempActivities = _.cloneDeep(activitiesBuffer);
    activitiesBuffer.splice(0, tempActivities.length);
    const callData = {
        data: JSON.stringify(tempActivities),
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 3000
    };
    const serverCall = request.post({
        url: pxconfig.SERVER_HOST + pxconfig.SERVER_COLLECT_URI,
        form: callData.data,
        headers: callData.headers,
        proxy: pxconfig.PROXY_URL,
        timeout: pxconfig.API_TIMEOUT_MS
    }, function(err, response, data) {
        if (!response || response.statusCode != 200) {
            pxlogger.error(`failed to post activities to perimeterx servers`);
        }
    });
}
