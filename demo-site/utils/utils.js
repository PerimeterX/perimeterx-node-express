// region imports
const fs = require('fs');
const path = require('path');
const process = require('process');
const readline = require('readline');
const { SERVERS_DIRECTORY_PATH, SERVER_CONFIG_FILE_NAME, SERVER_CONFIG_INC_FILE_NAME, JSON_SPACING } = require('./constants');
// endregion

const forEachServer = async (callback) => {
    const serverDirectories = fs.readdirSync(SERVERS_DIRECTORY_PATH);
    for (const serverName of serverDirectories) {
        const serverPath = getServerAbsolutePath(serverName);
        const serverConfig = getServerConfig(serverPath);

        if (!serverConfig) {
            console.error("Couldn't get configs for", serverName);
            continue;
        }

        await callback(serverName, serverPath, serverConfig);
    }
};

const getServerConfig = (serverPath) => {
    if (!path.isAbsolute(serverPath)) {
        serverPath = getServerAbsolutePath(serverPath);
    }
    const configJson = loadJson(path.join(serverPath, `${SERVER_CONFIG_FILE_NAME}`));
    if (configJson) {
        return configJson;
    }

    const configIncJson = loadJson(path.join(serverPath, `${SERVER_CONFIG_INC_FILE_NAME}`));
    if (configIncJson) {
        console.log(`No ${serverPath}/${SERVER_CONFIG_FILE_NAME}, using ${SERVER_CONFIG_INC_FILE_NAME} instead!`);
        return configIncJson;
    }

    console.error(`No ${serverPath}/${SERVER_CONFIG_FILE_NAME} or ${SERVER_CONFIG_INC_FILE_NAME} files found!`);
    return null;
};

const getServerAbsolutePath = (serverDir) => {
    return path.join(SERVERS_DIRECTORY_PATH, serverDir);
};

const loadJson = (path) => {
    if (fs.existsSync(path)) {
        return JSON.parse(fs.readFileSync(path));
    }
    return null;
}

const saveJson = (filename, jsonObject) => {
    fs.writeFileSync(filename, JSON.stringify(jsonObject, null, JSON_SPACING));
}

const sortObjectAlphabeticallyByKey = (object) => {
    return Object.keys(object).sort().reduce((obj, key) => {
        obj[key] = object[key];
        return obj;
    }, {});
};

const getUserInput = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => rl.question(query + " ", (ans) => {
        rl.close();
        resolve(ans);
    }));
};

const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const normalizeEnforcerName = (enforcerName) => {
    return enforcerName.split(/[_\.\-]/g).map(capitalize).join(' ');
};

const allEnvVariablesExist = (requiredEnvVariables) => {
    if (!requiredEnvVariables || !Array.isArray(requiredEnvVariables)) {
        return false;
    }

    const messages = [];
    for (const variableName of requiredEnvVariables) {
        if (!process.env[variableName]) {
            messages.push(`You must define environment variable ${variableName}`);
        }
    }

    if (messages.length === 0) {
        return true;
    }
    console.log(messages.join("\n"));
    return false;
}

module.exports = {
    forEachServer,
    getServerConfig,
    getServerAbsolutePath,
    loadJson,
    saveJson,
    sortObjectAlphabeticallyByKey,
    getUserInput,
    capitalize,
    normalizeEnforcerName,
    allEnvVariablesExist
};