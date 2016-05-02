'use strict';
const client = require('restler');
const _ = require('lodash');
const pxlogger = require('./pxlogger');
const pxconfig = require('../pxconfig').conf();

exports.init = initClient;
exports.sendToPerimeterX = sendToPerimeterX;

let activitiesBuffer = [];

function initClient() {
    setTimeout(function () {
        if (activitiesBuffer.length) {
            submitActivities();
        }
    }, 1000);
}

function sendToPerimeterX(activity_type, details, pxCtx) {
    if (activity_type == 'page_requested' && !pxconfig.SEND_PAGE_ACTIVITIES) {
        return;
    }
    details.block_module = 'px-node-express';
    const pxData = {};
    pxData.type = activity_type;
    pxData.headers = pxCtx.headers;
    pxData.timestamp = Date.now();
    pxData.socket_ip = pxCtx.ip;
    pxData.px_app_id = pxconfig.PX_APP_ID;
    pxData.details = details;

    activitiesBuffer.push(pxData);

    if (activitiesBuffer.length > 0) {
        submitActivities()
    }
}

function submitActivities() {
    const tempActivities = _.cloneDeep(activitiesBuffer);
    activitiesBuffer.splice(0, tempActivities.length);
    const callData = {
        data: JSON.stringify(tempActivities),
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 3000
    };
    const serverCall = client.post(pxconfig.SERVER_HOST + pxconfig.SERVER_COLLECT_URI, callData);
    serverCall.on('complete', function (data, response) {
        if (!response || response.statusCode != 200) {
            pxlogger.error(`failed to post activities to perimeterx servers`);
        }
    });
}