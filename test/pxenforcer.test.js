const { describe, it } = require("mocha");
const { expect } = require("chai");
const sinon = require("sinon");

const PerimeterXEnforcer = require("../lib/pxenforcer");

describe("PerimeterXEnforcer", () => {
    const BASIC_CONFIG = {
        px_app_id: 'PX_APP_ID',
        px_cookie_secret: 'PX_COOKIE_SECRET',
        px_auth_token: 'PX_AUTH_TOKEN'
    };

    describe("newMiddleware", () => {
        it("should return a function that accepts 3 parameters (req, res, next)", () => {
            // arrange
            const pxEnforcer = new PerimeterXEnforcer(BASIC_CONFIG);

            // act
            const middleware = pxEnforcer.newMiddleware();

            // assert
            expect(middleware).to.be.a('function').with.lengthOf(3);
        });
    });

    describe("sendAdditionalS2SActivity", () => {
        it("should call the enforcer's sendAdditionalS2SActivity function", () => {
            // arrange
            const pxEnforcer = new PerimeterXEnforcer(BASIC_CONFIG);
            const req = { locals: { pxCtx: {} } };

            const spy = sinon.spy();
            pxEnforcer.enforcer.sendAdditionalS2SActivity = spy;

            // act
            pxEnforcer.sendAdditionalS2SActivity(req, 200, true);

            // assert
            expect(spy.calledOnce).to.be.true;
        });

        it("should not call enforcer's sendAdditionalS2SActivity function if no pxCtx on request", () => {
            // arrange
            const pxEnforcer = new PerimeterXEnforcer(BASIC_CONFIG);
            const req = {};

            const spy = sinon.spy();
            pxEnforcer.enforcer.sendAdditionalS2SActivity = spy;

            // act
            pxEnforcer.sendAdditionalS2SActivity(req, 200, true);

            // assert
            expect(spy.notCalled).to.be.true;
        });
    });
})