import fs from "fs";
import path from "path";
import Joi from "joi";

import {log} from "./log.mjs";

const machineSchema = Joi.object({
    name: Joi.string(),
    macAddress: Joi.string()
        .replace(":", "")
        .replace("-", "")
        .hex().length(12).required(),
    ipAddress: Joi.string().ip({version: ["ipv4"], cidr: "required"})
});

const configSchema = Joi.object({
    machines: Joi.array().items(machineSchema).default([]),
    defaultSubnet: Joi.string().ip({version: ["ipv4"], cidr: "required"}),
    magicPacketUDP: Joi.valid(7, 9).default(9),
    sendUnicast: Joi.boolean()
});

const configTemplate = configSchema.validate({}).value;

const configPath = process.argv[2];
const persistence = typeof configPath !== "undefined" && configPath !== "";

let configStorage;
if (persistence) {
    if (path.extname(configPath) !== ".json") {
        log("Configuration file is not JSON.", "Critical");
        process.exit();
    }
    if (!fs.existsSync(configPath)) {
        log(`Creating a configuration file at "${configPath}" ...`, "Info");
        try {
            fs.writeFileSync(configPath, JSON.stringify(configTemplate));
            configStorage = configTemplate;
        } catch (e) {
            log(`Unable to create configuration file at "${configPath}". Detail: ${e.message}.`, "Critical");
            process.exit();
        }
    } else {
        let configFileContent;
        try {
            configFileContent = fs.readFileSync(configPath);
        } catch (e) {
            log(`Unable to read configuration file "${configPath}". Detail: ${e.message}.`, "Critical");
            process.exit();
        }
        try {
            let validatedConfig = configSchema.validate(JSON.parse(configFileContent.toString()));
            if (!validatedConfig.error) {
                configStorage = validatedConfig.value;
            } else {
                log(`Error in configuration. Detail: ${validatedConfig.error.message}.`, "Critical");
                process.exit();
            }
        } catch (e) {
            log("Corrupted JSON content in the configuration file.", "Critical");
            process.exit();
        }
    }
} else {
    log("Configuration is not persistent, Added machines will gone after a restart.", "Warning")
    configStorage = configTemplate;
}

function writeConfigToDisk() {
    log("Writing the configuration to disk ...", "Info");
    try {
        let tempFilePath = `${path.dirname(configPath)}/.${path.basename(configPath)}.tmp`;
        let backupFilePath = `${path.dirname(configPath)}/${path.basename(configPath, "json")}bak`;
        if (fs.existsSync(tempFilePath)) {
            fs.rmSync(tempFilePath);
        }
        fs.writeFileSync(tempFilePath, JSON.stringify(configStorage));
        if (fs.existsSync(backupFilePath)) {
            fs.rmSync(backupFilePath);
        }
        fs.renameSync(configPath, backupFilePath);
        fs.renameSync(tempFilePath, configPath);
    } catch (e) {
        log(`Error when writing the configuration file. Detail: ${e.message}.`, "Critical");
        process.exit();
    }
}

export {
    configStorage,
    machineSchema,
    persistence,
    writeConfigToDisk
};
