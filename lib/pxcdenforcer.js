const axios = require('axios');
const cdEnforce = require('perimeterx-node-core').PxCdEnforcer;
const CSP_DATA_PROVIDER = {
    BASE_URL: 'https://api.perimeterx.com/v1/enforcer-data',
    TIMESTAMP: 'timestamp'
};
const CSP_DEFAULTS = {
    NO_UPDATES_MAX_INTERVAL: 60,
    POLICY_REFRESH_INTERVAL: 5
};
const MILLISECONDS_IN_MINUTE = 60000;

class cdEnforcer {
    constructor(config) {
        const cspNoUpdatesMaxInterval = config['cspNoUpdatesMaxIntervalMinutes'] ? config['cspNoUpdatesMaxIntervalMinutes'] : CSP_DEFAULTS.NO_UPDATES_MAX_INTERVAL;
        const cspPolicyRefreshIntervalMinutes = config['cspPolicyRefreshIntervalMinutes'] ? config['cspPolicyRefreshIntervalMinutes'] : CSP_DEFAULTS.POLICY_REFRESH_INTERVAL;
        this.maxInterval = cspNoUpdatesMaxInterval;
        this.cspData = {};
        this.enforce = cdEnforce;
        setInterval(this.getCspData.bind(this), cspPolicyRefreshIntervalMinutes * MILLISECONDS_IN_MINUTE, config['pxAppId'], config['authToken']);
    }

    async getCspData(appId, bearer) {
        try{
            const response = await cdEnforcer.sendApiRequest(appId, bearer);
            const responseBody = response.data; 
            if (responseBody && responseBody.success == true && responseBody.data){
                const cspData = JSON.parse(Buffer.from(responseBody.data, 'base64')).csp;
                this.updateLocalCspData(cspData);
            }
        }
        catch (error) {
            console.log(`Exception caught while sending api request to get CSP data. error: ${error}`);
        }
    }

    static async sendApiRequest(appId, bearer) {
        const apiRequestUrl = new URL(CSP_DATA_PROVIDER.BASE_URL);
        apiRequestUrl.searchParams.append('app_id', appId);
        apiRequestUrl.searchParams.append('feature', 'csp');
        apiRequestUrl.searchParams.append('timestamp', '0');
    
        return await axios.get(apiRequestUrl.toString(), {
            headers: {
                'Authorization': `Bearer ${bearer}`
            }
        });
    }

    updateLocalCspData(cspData) {
        this.cspData = cspData;
        this.cspData[CSP_DATA_PROVIDER.TIMESTAMP] = Date.now();
    }
}

module.exports = cdEnforcer;