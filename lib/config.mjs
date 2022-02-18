import fs from "fs";
import path from "path";
import Joi from "joi";

const machineSchema = Joi.object({
    name: Joi.string(),
    macAddress: Joi.string()
        .replace(":", "")
        .replace("-", "")
        .hex().length(12).required(),
    ipAddress: Joi.string().ip({cidr: "required"})
});

const configPath = process.argv[2];
const persistence = typeof configPath !== "undefined" && configPath !== "";

if (path.extname(configPath) !== ".json") {
    console.log("Configuration file is not JSON.");
    process.exit();
}

const configTemplate = {
    machines: []
};

let configStorage;
if (persistence) {
    if (!fs.existsSync(configPath)) {
        console.log(`Creating configuration file at "${configPath}" ...`);
        try {
            fs.writeFileSync(configPath, JSON.stringify(configTemplate));
            configStorage = configTemplate;
        } catch (e) {
            console.log(`Unable to create configuration file at "${configPath}". Detail: ${e.message}.`);
            process.exit();
        }
    } else {
        let configFileContent;
        try {
            configFileContent = fs.readFileSync(configPath);
        } catch (e) {
            console.log(`Unable to read configuration file at "${configPath}". Detail: ${e.message}.`);
            process.exit();
        }
        let parsedConfig;
        try {
            parsedConfig = JSON.parse(configFileContent.toString());
            let validatedConfig = Joi.object({
                machines: Joi.array().items(machineSchema).default([]),
                defaultSubnet: Joi.string().ip({cidr: "required"}),
                magicPacketUDP: Joi.valid(0, 7, 9)
            }).validate(parsedConfig);
            if (!validatedConfig.error) {
                configStorage = validatedConfig.value;
            } else {
                console.log(`Error in configuration. Detail: ${validatedConfig.error.message}.`);
                process.exit();
            }
        } catch (e) {
            console.log("Corrupted JSON content in configuration file.");
            process.exit();
        }
    }
} else {
    configStorage = configTemplate;
}

function writeConfigToDisk() {
    console.log("Writing configuration to disk ...");
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
        console.log(`Error when writing configuration file. Detail: ${e.message}.`);
    }
}

export {
    configStorage,
    machineSchema,
    persistence,
    writeConfigToDisk
};
