const pxClient = require('perimeterx-node-core').client;

/**
 * initClient - initialize activities client timer to flash activities once a second
 *
 */
function initClient() {
    setInterval(() => {
        pxClient.submitActivities();
    }, 1000);
}

module.exports = {
    init: initClient
};