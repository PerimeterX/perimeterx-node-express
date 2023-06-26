// region imports
const path = require('path');
const sharedConfig = require('../shared_config.json');
const { forEachServer, sortObjectAlphabeticallyByKey, capitalize, saveJson } = require('../utils/utils');
const { PX_ENFORCER_CONFIG_FILE_NAME } = require('../utils/constants');
// endregion

const main = () => {
    forEachServer((serverName, serverPath, serverConfig) => {
        const pxConfig = mergeConfigs(serverConfig, sharedConfig);
        saveJson(path.join(serverPath, `${PX_ENFORCER_CONFIG_FILE_NAME}`), pxConfig);
        console.log(`Successfully created ${PX_ENFORCER_CONFIG_FILE_NAME} for ${capitalize(serverName)}`);
    });
};

const mergeConfigs = (serverConfig, sharedConfig) => {
    const { enforcer_credentials, enforcer_config_override } = serverConfig;
    const { enforcer_config } = sharedConfig;
    return sortObjectAlphabeticallyByKey(Object.assign({}, enforcer_config, enforcer_credentials, enforcer_config_override));
};

main();
