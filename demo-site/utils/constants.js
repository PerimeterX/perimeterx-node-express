// region imports
const path = require('path');
// endregion

const JSON_SPACING = 4;

const SERVER_CONFIG_FILE_NAME = 'px_config.json';
const SERVER_CONFIG_INC_FILE_NAME = "config.inc.json";
const CONFIG_FILE_NAME = 'px_config.json';

const SERVERS_DIRECTORY_NAME = "servers";
const SERVERS_DIRECTORY_PATH = path.join(__dirname, `../${SERVERS_DIRECTORY_NAME}`);

const FIRST_PARTY_STATIC_FILE_SUFFIX = ".firstparty";
const THIRD_PARTY_STATIC_FILE_SUFFIX = "";

const PX_METADATA_FILE_NAME = "px_metadata.json";

const INDEX_ROUTE = "/";
const LOGIN_ROUTE = "/login";
const LOGOUT_ROUTE = "/logout";

const EXPECTED_USERNAME = "pxUser";
const EXPECTED_PASSWORD = "1234";

module.exports = {
    JSON_SPACING,
    CONFIG_FILE_NAME,
    SERVER_CONFIG_FILE_NAME,
    SERVER_CONFIG_INC_FILE_NAME,
    SERVERS_DIRECTORY_NAME,
    SERVERS_DIRECTORY_PATH,
    FIRST_PARTY_STATIC_FILE_SUFFIX,
    THIRD_PARTY_STATIC_FILE_SUFFIX,
    PX_METADATA_FILE_NAME,
    INDEX_ROUTE,
    LOGIN_ROUTE,
    LOGOUT_ROUTE,
    EXPECTED_USERNAME,
    EXPECTED_PASSWORD
};