const PxClient = require('perimeterx-node-core').PxClient;

class PxExpressClient extends PxClient {
    init(config) {
        this.intervalId = setInterval(() => {
            this.submitActivities(config);
        }, 1000);
    }

    stop() {
        clearInterval(this.intervalId);
    }
}

module.exports = PxExpressClient;