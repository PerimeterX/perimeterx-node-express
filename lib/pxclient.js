const PxClient = require('perimeterx-node-core').PxClient;

class PxExpressClient extends PxClient {
    init(config) {
        setInterval(() => {
            this.submitActivities(config);
        }, 1000);
    }
}

module.exports = PxExpressClient;