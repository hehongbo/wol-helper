import express from "express";

import {
    configStorage,
    machineSchema,
    persistence,
    writeConfigToDisk
} from "../config.mjs";

const machineAPI = express.Router();
machineAPI.use(express.json());

machineAPI.route("/").get((req, res, next) => {
    res.send(configStorage.machines);
    next();
}).post((req, res) => {
    let validatedMachineConfig = machineSchema.validate(req.body);
    if (!validatedMachineConfig.error) {
        console.log(`Proceed with machine creation, detail: ${JSON.stringify(validatedMachineConfig.value)}`);
        let duplicated = configStorage.machines.some(machine =>
            machine.macAddress === validatedMachineConfig.value.macAddress);
        if (!duplicated) {
            configStorage.machines.push(validatedMachineConfig.value);
            if (persistence) {
                writeConfigToDisk();
            } else {
                console.log("Configuration is not persistent, added machine will gone after a restart.");
            }
            res.status(201);
            res.send(validatedMachineConfig.value);
        } else {
            let message = `Machine with MAC Address "${validatedMachineConfig.value.macAddress}" already exists.`;
            console.log(message);
            res.status(400);
            res.send({message: message});
        }
    } else {
        console.log(`Failed to validate machine configuration, detail: ${validatedMachineConfig.error.message}`);
        res.status(400);
        res.send({message: validatedMachineConfig.error.message});
    }
});

machineAPI.route("/:macAddr/").all((req, res, next) => {
    let macAddr = req.params["macAddr"].toLowerCase();
    if (macAddr.search(/([0-9]|[a-f]){12}$/) === 0) {
        if (configStorage.machines.some(machine => machine.macAddress === macAddr)) {
            next();
        } else {
            res.status(404);
            res.send({message: "No such machine."});
        }
    } else {
        res.status(400);
        res.send({message: "Wrong MAC address format (Please use 12 hex digits without dots, colons and slashes)."});
    }
}).get((req, res, next) => {
    res.send(configStorage.machines.filter(machine => machine.macAddress === req.params["macAddr"].toLowerCase())[0]);
    next();
}).put((req, res, next) => {
    let validatedMachineConfig = machineSchema.validate(req.body);
    if (!validatedMachineConfig.error) {
        console.log(`Proceed with machine Update, detail: ${JSON.stringify(validatedMachineConfig.value)}`);
        configStorage.machines[configStorage.machines.findIndex(
            machine => machine.macAddress === req.params["macAddr"]
        )] = validatedMachineConfig.value;
        if (persistence) {
            writeConfigToDisk();
        } else {
            console.log("Configuration is not persistent, Updated machine will gone after a restart.");
        }
        res.send(validatedMachineConfig.value);
    } else {
        console.log(`Failed to validate machine configuration, detail: ${validatedMachineConfig.error.message}`);
        res.status(400);
        res.send({message: validatedMachineConfig.error.message});
    }
    next();
}).delete((req, res) => {
    let macAddr = req.params["macAddr"].toLowerCase();
    console.log(`Deleting machine "${macAddr}"`);
    configStorage.machines = configStorage.machines.filter(machine => machine.macAddress !== macAddr);
    if (persistence) {
        writeConfigToDisk();
    }
    res.send({message: "Deleted."});
});

export {machineAPI};
