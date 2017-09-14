const PxClient = require('perimeterx-node-core').PxClient;

class PxExpressClient extends PxClient {
    init() {
        setInterval(() => {
            this.submitActivities();
        }, 1000);
    }
}
/**
 * initClient - initialize activities client timer to flash activities once a second
 *
 */
function initClient() {

}

module.exports = PxExpressClient;