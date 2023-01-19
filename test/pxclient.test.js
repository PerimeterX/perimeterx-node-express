const { describe, it } = require("mocha");
const { expect } = require("chai");

const PxExpressClient = require("../lib/pxclient");

describe('PxExpressClient', () => {
    const BASIC_CONFIG = {
        px_app_id: 'PX_APP_ID',
        px_cookie_secret: 'PX_COOKIE_SECRET',
        px_auth_token: 'PX_AUTH_TOKEN'
    };

    describe("init", () => {
        it("should initialize an interval that sends activities every 1000 ms", (done) => {
            // arrange
            const client = new PxExpressClient();
            const expectedIntervalMs = 1000;
            const allowedDeltaMs = 10;
            const startTime = Date.now();

            // act
            client.init(BASIC_CONFIG);

            // assert
            client.submitActivities = () => {
                expect(Date.now()).to.be.approximately(startTime + expectedIntervalMs, allowedDeltaMs);
                client.stop();
                done();
            };
        });
    });
});