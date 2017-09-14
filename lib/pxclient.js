const PxClient = require('perimeterx-node-core').PxClient;

class PxExpressClient extends PxClient {
    init() {
        setInterval(() => {
            this.submitActivities();
        }, 1000);
    }
}

module.exports = PxExpressClient;