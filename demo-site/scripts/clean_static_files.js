//region imports
const fs = require('fs');
const path = require('path');
const process = require('process');
const { forEachServer, getUserInput, capitalize } = require("../utils/utils");
const { CONFIG_FILE_NAME } = require('../utils/constants');
//endregion

const FILE_TYPES_TO_DELETE = [".html", ".css"];

const main = async () => {
    if (!(await confirmDeletion())) {
        console.log("Public directories will not be deleted.");
        return;
    }

    forEachServer((serverName, serverPath, serverConfig) => {
        cleanStaticFiles(serverPath, serverConfig);
        console.log(`Cleaned static files for ${capitalize(serverName)}`);
    });
};

const confirmDeletion = async () => {
    const FLAG_INDEX = 2;
    const CONFIRM_DELETION_FLAG = "-y";
    const YES_ANSWERS = ["yes", "y"];

    if (process.argv[FLAG_INDEX] === CONFIRM_DELETION_FLAG) {
        return true;
    }
    
    const response = await getUserInput("Are you sure you want to delete static files in all servers?");
    return YES_ANSWERS.includes(response.toLowerCase());
};

const cleanStaticFiles = (serverPath, config) => {
    if (!config.site_config || !config.site_config.public_output_dir) {
        console.error(`No property "public_output_dir" in ${serverPath}/${CONFIG_FILE_NAME}.json: ${config}`);
        process.exit(1);
    }

    if (config.site_config.public_output_dir === ".") {
        fs.readdirSync(serverPath).forEach((filename) => {
            for (const filetype of FILE_TYPES_TO_DELETE) {
                if (filename.endsWith(filetype)) {
                    fs.rmSync(path.join(serverPath, filename));
                }
            }
        });
    } else {
        const publicFilesPath = path.join(serverPath, config.site_config.public_output_dir);
        if (fs.existsSync(publicFilesPath)) {
            fs.rmdirSync(publicFilesPath, { recursive: true, force: true });
        }
    }
};

main();