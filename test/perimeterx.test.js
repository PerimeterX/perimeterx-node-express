const { describe, it } = require("mocha");
const { expect } = require("chai");

const { PxEnforcer } = require("perimeterx-node-core");

const PerimeterXEnforcer = require("../lib/pxenforcer");
const sinon = require("sinon");

let perimeterx;

describe("perimeterx", () => {
    const BASIC_CONFIG = {
        px_app_id: 'PX_APP_ID',
        px_cookie_secret: 'PX_COOKIE_SECRET',
        px_auth_token: 'PX_AUTH_TOKEN'
    };

    beforeEach(() => {
        // re-import the module each time so we're starting from scratch
        delete require.cache[require.resolve('../lib/perimeterx')];
        perimeterx = require("../lib/perimeterx");
    });

    describe('init', () => {
        it('should replace the existing enforcer export with a new one', () => {
            // arrange
            perimeterx.init(BASIC_CONFIG);
            const oldEnforcer = perimeterx.enforcer();

            const differentConfig = { ...BASIC_CONFIG, px_app_id: 'DIFFERENT_APP_ID' };

            // act
            perimeterx.init(differentConfig);

            // assert
            const newEnforcer = perimeterx.enforcer();
            expect(newEnforcer).not.to.equal(oldEnforcer);
        });

        it('should initialize the middleware function as an export', () => {
            // arrange
            expect(perimeterx.middleware).to.not.exist;

            // act
            perimeterx.init(BASIC_CONFIG);

            // assert
            expect(perimeterx.middleware).to.be.a('function').with.lengthOf(3);
        });
    });

    describe('enforcer', () => {
        it("should return null if module has not been initialized", () => {
            // act
            const enforcer = perimeterx.enforcer();

            // assert
            expect(enforcer).to.be.null;
        });

        it("should return an instance of PxEnforcer if the module has been initialized", () => {
            // arrange
            perimeterx.init(BASIC_CONFIG);

            // act
            const enforcer = perimeterx.enforcer();

            // assert
            expect(enforcer).to.be.instanceof(PxEnforcer);
        });
    });

    describe('new', () => {
        it('should return an instance of PerimeterXEnforcer', () => {
            // act
            const pxEnforcer = perimeterx.new(BASIC_CONFIG);

            // assert
            expect(pxEnforcer).to.be.instanceof(PerimeterXEnforcer);
        });
    });

    describe('middleware', () => {
        it("should call the enforcer's enforce() function", async () => {
            // arrange
            const fakeReq = { cookies: {} };
            const fakeRes = {};
            const fakeNext = () => {};

            perimeterx.init(BASIC_CONFIG);
            perimeterx.enforcer().enforce = sinon.spy();

            // act
            perimeterx.middleware(fakeReq, fakeRes, fakeNext);

            // assert
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(perimeterx.enforcer().enforce.calledOnce).to.be.true;
        });
    })
});