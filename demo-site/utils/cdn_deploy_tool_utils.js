const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadJson, saveJson } = require("./utils");
const { 
    CDN_DEPLOY_TOOL_RUN_CLI_COMMAND,
    CDN_DEPLOY_TOOL_CONFIG_FILE_NAME,
    CDN_DEPLOY_TOOL_BUILD_COMMAND
} = require("./constants");

const setCDNDeployToolPipeline = (deployToolPath, cdnType, deployType) => {
    const deployToolConfigPath = path.join(deployToolPath, "configs", CDN_DEPLOY_TOOL_CONFIG_FILE_NAME);
    const deployToolConfig = loadJson(deployToolConfigPath);
    if (!deployToolConfig) {
        console.error(`Cannot find ${deployToolConfigPath}!`);
        return false;
    }

    deployToolConfig.cdnType = cdnType;
    deployToolConfig.deployType = deployType;

    saveJson(deployToolConfigPath, deployToolConfig);
    return true;
};

const getCDNDeployToolPipelineConfig = (deployToolPath, pipelineName) => {
    const pipelineConfigIncPath = path.join(deployToolPath, `configs/pipelines/${pipelineName}/pipelineConfig.inc.json`);
    const pipelineConfigIncJson = loadJson(pipelineConfigIncPath);
    if (pipelineConfigIncJson) {
        return pipelineConfigIncJson;
    }
    console.error(`Cannot find ${pipelineConfigIncPath}!`);
    return null;
};

const setCDNDeployToolPipelineConfig = (deployToolPath, pipelineName, pipelineConfig) => {
    const pipelineConfigPath = path.join(deployToolPath, `configs/pipelines/${pipelineName}/pipelineConfig.json`);
    saveJson(pipelineConfigPath, pipelineConfig);
    return true;
}

const runCDNDeployTool = (deployToolPath) => {
    if (!isCDNDeployToolReady(deployToolPath)) {
        return false;
    }
    console.log("\nRunning deploy pipeline");
    if (!runCDNDeployToolCommand(deployToolPath, CDN_DEPLOY_TOOL_RUN_CLI_COMMAND)) {
        return false;
    }
    console.log("Deploy completed successfully!");
    return true;
}

const isCDNDeployToolReady = (deployToolPath) => {
    if (!fs.existsSync(path.join(deployToolPath, "node_modules"))) {
        console.error("CDN Deploy tool dependencies are not installed");
        return false;
    }
    if (!fs.existsSync(path.join(deployToolPath, "build"))) {
        console.info("CDN Deploy tool has not been compiled");
        if (!runCDNDeployToolCommand(deployToolPath, CDN_DEPLOY_TOOL_BUILD_COMMAND)) {
            return false;
        }
    }
    return true;
}

const runCDNDeployToolCommand = (deployToolPath, command) => {
    const output = execSync(command, { cwd: deployToolPath });
    console.log(output + '\n');
    let outputString = output.toString();
    console.log(outputString);
    outputString = outputString.toLowerCase();
    return outputString.indexOf("error") === -1 && outputString.indexOf("fail") === -1;
}

module.exports = {
    setCDNDeployToolPipeline,
    getCDNDeployToolPipelineConfig,
    setCDNDeployToolPipelineConfig,
    runCDNDeployTool
}