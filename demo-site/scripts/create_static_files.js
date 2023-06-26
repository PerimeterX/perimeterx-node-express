//region imports
const fs = require('fs');
const path = require('path');
const sharedConfig = require('../shared_config.json');
const { forEachServer, normalizeEnforcerName } = require("../utils/utils");
const { CONFIG_FILE_NAME } = require('../utils/constants');
//endregion

const TEMPLATE_INDICATOR = sharedConfig.site_config.template_indicator;
const REPLACE_VARIABLE_REGEX = /\${[A-Za-z1-9_]*}/gi;

const main = () => {
    const publicTemplateDir = path.join(__dirname, "..", sharedConfig.site_config.public_template_dir);
    forEachServer((serverName, serverPath, serverConfig) => {
        const publicDir = createPublicDirForServer(serverPath, serverConfig);
        if (!publicDir) {
            console.error(`Couldn't create public dir for ${serverName} server`);
            process.exit(1);
        }

        if (!copyStaticFiles(publicTemplateDir, serverConfig, serverName, publicDir)) {
            console.error(`Could not copy static files for ${normalizeEnforcerName(serverName)}. Skipping...`);
        } else {   
            console.log(`Successfully created static files for ${normalizeEnforcerName(serverName)}`);
        }
    });
};

const copyStaticFiles = (publicTemplateDir, serverConfig, serverName, publicDir) => {
    const replaceVariableMaps = createReplacementVariableMaps(serverConfig, serverName);
    if (!replaceVariableMaps) {
        return false;
    }
    
    const fileNames = fs.readdirSync(publicTemplateDir);
    for (const fileName of fileNames) {
        copyFileToServerDirectory(fileName, publicTemplateDir, replaceVariableMaps, publicDir);
    }
    return true;
};

const copyFileToServerDirectory = (fileName, publicTemplateDir, replaceVariableMaps, publicDir) => {
    if (fileName.includes(TEMPLATE_INDICATOR)) {
        copyTemplateToServerDirectory(fileName, publicTemplateDir, replaceVariableMaps, publicDir);
    } else {
        copyStaticFileToServerDirectory(fileName, publicTemplateDir, publicDir);
    }
};

const copyTemplateToServerDirectory = (fileName, publicTemplateDir, replaceVariableMaps, publicDir) => {
    const template = fs.readFileSync(path.join(publicTemplateDir, fileName)).toString();
    for (const { templateIndicatorReplacement, replacementMap } of replaceVariableMaps) {
        const fileContents = fillInTemplate(template, replacementMap);
        const newFileName = fileName.replace(TEMPLATE_INDICATOR, templateIndicatorReplacement);
        fs.writeFileSync(path.join(publicDir, newFileName), fileContents);
    }
};

const copyStaticFileToServerDirectory = (fileName, publicTemplateDir, publicDir) => {
    const fileContents = fs.readFileSync(path.join(publicTemplateDir, fileName)).toString();
    fs.writeFileSync(path.join(publicDir, fileName), fileContents);
};

const fillInTemplate = (template, replaceVariableMap) => {
    return template.replace(REPLACE_VARIABLE_REGEX, (matched) => replaceVariableMap[matched]);
}

const createReplacementVariableMaps = (config, enforcerName) => {
    const appId = config.enforcer_credentials.px_app_id;
    if (appId == null || appId.length === 0) {
        console.error(`No px_app_id found in ${enforcerName}/${CONFIG_FILE_NAME}!`);
        return null;
    }
    const appIdSubstr = appId.substr(2);
    return [
        createReplacementInfo("", appId, `//client.px-cloud.net/${appId}/main.min.js`, enforcerName),
        createReplacementInfo(".firstparty", appId, `/${appIdSubstr}/init.js`, enforcerName)
    ];
};

const createReplacementInfo = (templateIndicatorReplacement, appId, sensorSrcUrl, enforcerName) => {
    return {
        templateIndicatorReplacement,
        replacementMap: {
            "${app_id}": appId,
            "${sensor_src_url}": sensorSrcUrl,
            "${enforcer_name}": normalizeEnforcerName(enforcerName)
        }
    };
};

const createPublicDirForServer = (serverPath, config) => {
    if (!config.site_config || !config.site_config.public_output_dir) {
        console.error(`No property "public_output_dir" in ${serverPath}/${CONFIG_FILE_NAME}: ${config}`);
        return null;
    }

    const publicFilesPath = path.join(serverPath, config.site_config.public_output_dir);
    if (!fs.existsSync(publicFilesPath)) {
        fs.mkdirSync(publicFilesPath);
    }
    return publicFilesPath;
};

main();
