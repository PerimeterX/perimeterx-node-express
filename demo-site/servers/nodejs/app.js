const path = require('path');
const axios = require('axios');
const express = require('express');
const cookieParser = require('cookie-parser');
const formData = require("express-form-data");
const perimeterx = require('perimeterx-node-express');

const pxConfigJson = require('./px_config.json');

const PORT = 3000;

var PxMiddleware;
var PxCdMiddleware;
let pxConfig;
var PxCdInterval;
var pxInstance;

const main = () => {
    pxConfig = initializeConfigs();

    const app = initializeApp();
    if (process.env.ENABLE_TEST_ENDPOINTS === "true") {
        setAdditionalActivityHandler(pxConfig);
        setCustomParam(pxConfig);
    }
    setPxMiddleware(app);
    setRoutes(app);
    setTestEndpoints(app);
    setStaticRoutes(app);

    const server = app.listen(PORT, '0.0.0.0', function () {
        console.log(`NodeJS sample site is listening on port ${PORT}!`)
    });

    process.on('SIGINT', () => {
        console.log('Closing http server...');
        server.close();
        process.exit(0);
    });
}

const initializeApp = () => {
    const app = express();
    app.use(cookieParser());
    app.use(express.json()); 
    app.use(express.urlencoded());
    // support form-data/multipart bodies
    app.use(formData.parse());
    app.use(formData.format());
    app.use(formData.stream());
    app.use(formData.union());
    app.use((req, res, next) => {
        console.log(req.method, req.path);
        next();
    })
    return app;
}

const setPxMiddleware = (app) => {
    pxInstance = perimeterx.new(pxConfig)
    PxMiddleware = pxInstance.middleware;
    app.use(PxMiddlewareWrap);

    if (pxInstance.cdEnforcer) {
        PxCdMiddleware = pxInstance.cdMiddleware;
        PxCdInterval = pxInstance.cdEnforcer.setIntervalId;
        app.use(PxCdMiddleware);
    }
    app.use((req, res, next) => {
        for (const [name, value] of Object.entries(req.headers)) {
            res.setHeader(name, value);
        }
        next();
    });
}

const initializeConfigs = () => {
    return addEnvConfigs(pxConfigJson);
}

const setAdditionalActivityHandler = (pxConfig) => {
    pxConfig['px_additional_activity_handler'] = (pxCtx) => {
        const { uri, pxde, pxdeVerified, score } = pxCtx;
        axios.post(pxConfig.px_backend_url + "/additional" + uri, {
            _pxde: pxde,
            pxdeVerified: pxdeVerified,
            pxScore: score
        }).catch((e) => console.log(e.message));
    };
}

const setCustomParam = (pxConfig) => {
    pxConfig['px_enrich_custom_parameters'] = (px_context, px_config)=>{
        let customParams = [];
        for (let i = 1; i < 3; i++) {
            let param_key = `custom_param${i}`;
            let value = `test${i}`;
            customParams[param_key] = value;
        }
        for (let i = 3; i < 7; i++) {
            let param_key = `custom_param${i}`;
            let value = i;
            customParams[param_key] = value;
        }
        for (let i = 7; i <= 12; i++) {
            let param_key = `custom_param${i}`;
            let value = null;
            customParams[param_key] = value;
        }
        return customParams;
    };
}

const setTestEndpoints = (app) => {
    app.post('/config', function (req, res, next) {
        if(process.env.ENABLE_TEST_ENDPOINTS === 'false'){
            return res.sendStatus(404);
        }
        let newConfig = req.body;
        // merge new config into pxConfig
        Object.assign(pxConfig, newConfig)
        if (pxConfig['px_csp_enabled']) {
            clearInterval(PxCdInterval);
        }
        var pxInstance = perimeterx.new(pxConfig);
        PxMiddleware = pxInstance.middleware;
        setAdditionalActivityHandler(pxConfig);
        setCustomParam(pxConfig)
        res.sendStatus(200);
    });
    
    app.get('/supported-features', function (req, res, next) {
        if(process.env.ENABLE_TEST_ENDPOINTS === 'false'){
            return res.sendStatus(404);
        }
        const supportedFeatures = require('perimeterx-node-express/px_metadata.json');
        return res.json(supportedFeatures);
    });
    
    app.get('/test-app-credentials', function (req, res){
        if (process.env.ENABLE_TEST_ENDPOINTS === 'false'){
            return res.sendStatus(404);
        }
        const test_app_credentials = {
            "px_app_id": pxConfig.px_app_id,
            "px_cookie_secret": pxConfig.px_cookie_secret
        };
        return res.json(test_app_credentials)
    });
}

const setRoutes = (app) => {
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/public/index' + getRequiredSuffix() + '.html');
    })

    app.post('/login', function (req, res, next) {
        const loginSuccessful = req.body.username === 'pxUser' && req.body.password === '1234';
        res.pxLoginSuccessful = loginSuccessful;
        if (loginSuccessful) {
            res.sendFile(__dirname + '/public/profile' + getRequiredSuffix() +  '.html');
        } else {
            res.status(301).redirect('/');
        }
    });
    
    app.get('/logout', function (req, res) {
        res.redirect('/');
    });

}

const setStaticRoutes = (app) => {
    app.use(express.static(path.join(__dirname, 'public')));
}

const addEnvConfigs = (config) => {
    const envConfigs = {
        "px_app_id" : process.env.PX_APP_ID,
        "px_cookie_secret" : process.env.PX_COOKIE_SECRET,
    }
    for (const key in envConfigs){
        if (!envConfigs[key] || config[key] !== ""){
            delete envConfigs[key];
        }
    }
    Object.assign(config, envConfigs);
    return config;
};

const getRequiredSuffix = () => {
    return pxConfig.px_first_party_enabled ? ".firstparty" : "";
};

const PxMiddlewareWrap = (req, res, next) => {
    if (pxConfig.px_filter_by_route && pxConfig.px_filter_by_route.includes(req.path)){
        return next();
    } 
    PxMiddleware(req, res, next);
};

main();