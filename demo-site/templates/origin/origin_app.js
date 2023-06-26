const path = require('path');
const { env } = require('process');
const express = require('express');
const cookieParser = require('cookie-parser');
const {
    INDEX_ROUTE,
    LOGIN_ROUTE,
    LOGOUT_ROUTE,
    EXPECTED_USERNAME,
    EXPECTED_PASSWORD,
    FIRST_PARTY_STATIC_FILE_SUFFIX,
    THIRD_PARTY_STATIC_FILE_SUFFIX
} = require("../../utils/constants");

class OriginApp {
    constructor(enforcerType) {
        this.enforcerType = enforcerType;
        this.app = this.createApp();
    }

    createApp() {
        const app = express();
        app.use(cookieParser());
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.path}`);
            res.set(req.headers);
            next();
        })
        return app;
    }

    SetRoutes(staticRoutesDir, isFirstParty) {
        this.app.use(express.static(staticRoutesDir, {index: false}));

        const htmlSuffix = isFirstParty ? 
            FIRST_PARTY_STATIC_FILE_SUFFIX : THIRD_PARTY_STATIC_FILE_SUFFIX;

        this.app.get(INDEX_ROUTE, (req, res) => {
            const htmlPageName =  `index${htmlSuffix}.html`;
            res.sendFile(path.join(staticRoutesDir, htmlPageName));
        });
        
        this.app.post(LOGIN_ROUTE, (req, res) => {
            if (req.body.username === EXPECTED_USERNAME && 
                req.body.password === EXPECTED_PASSWORD) {
                res.sendFile(path.join(staticRoutesDir, `profile${htmlSuffix}.html`));
            } else {
                res.redirect(INDEX_ROUTE);
            }
        });
        
        this.app.get(LOGOUT_ROUTE, (req, res) => {
            res.redirect(INDEX_ROUTE);
        });
    }

    Start() {
        const port = env.PORT || 3000;
        const server = this.app.listen(port, '0.0.0.0', () => {
            console.log(`${this.enforcerType} origin listening on port ${port}!`)
        });
        
        process.on('SIGINT', () => {
            console.log('\nClosing http server...');
            server.close();
            process.exit(0);
        });
    }
}

module.exports = OriginApp;
