const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { env } = require('process');
const { loadJson } = require("../../utils/utils");
const { 
    TEST_APP_CREDENTIALS_ENDPOINT,
    SUPPORTED_FEATURES_ENDPOINT,
    CONFIG_ENDPOINT,
    PX_METADATA_FILE_NAME
} = require('../../utils/constants');

class TestEndpointsApp {
    constructor(enforcerType) {
        this.enforcerType = enforcerType;
        this.app = this.createApp();
    }

    createApp() {
        const app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use(express.urlencoded({
            extended: true
        }));
        return app;
    }

    SetTestAppCredentialsEndpoint({ px_app_id, px_cookie_secret }) {
        this.app.get(TEST_APP_CREDENTIALS_ENDPOINT, (req, res) => {
            console.log(`GET ${TEST_APP_CREDENTIALS_ENDPOINT}`);
            const credentials = {
                px_app_id,
                px_cookie_secret
            };
            res.json(credentials);
        });
    }

    SetSupportedFeaturesEndpoint(enforcerDir) {
        this.app.get(SUPPORTED_FEATURES_ENDPOINT, (req, res) => {
            console.log(`GET ${SUPPORTED_FEATURES_ENDPOINT}`);
            try {
                const pxMetadata = loadJson(path.join(enforcerDir, PX_METADATA_FILE_NAME));
                res.json(pxMetadata);
            } catch (err) {   
                console.error(err);
                res.sendStatus(500);
            }
        });
    }

    /** 
     * @param changeEnforcerConfigCallback: function (enforcerConfig, serverConfig) => boolean
     * the return value indicates whether the enforcer config was successfuly updated
     * 
     * @param serverConfig - object with structure identical to config.inc.json
     * fields are filled in with either the JSON values or env variables
    */
    SetConfigEndpoint(changeEnforcerConfigCallback, serverConfig) {
        this.app.post(CONFIG_ENDPOINT, async (req, res) => {
            console.log(`POST ${CONFIG_ENDPOINT}`);
            try {
                if (!changeEnforcerConfigCallback) {
                    console.log("Skipping changing enforcer config...");
                    return res.sendStatus(200);
                }
                if (!(await changeEnforcerConfigCallback(req.body, serverConfig))) {
                    console.error("Unable to change enforcer config!");
                    return res.sendStatus(500);
                }
                res.sendStatus(200);
            } catch (err) {
                console.error(err);
                res.sendStatus(500);
            }
        });
    }

    Start() {
        const port = env.PORT || 3000;
        const server = this.app.listen(port, '0.0.0.0', () => {
            console.log(`${this.enforcerType} test endpoints listening on port ${port}!`);
        });
    
        process.on('SIGINT', () => {
            console.log('\nClosing http server...');
            server.close();
            process.exit(0);
        });
    }
}

module.exports = TestEndpointsApp;