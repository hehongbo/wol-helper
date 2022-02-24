import express from "express";

import {log} from "../log.mjs";
import {
    configStorage,
    machineSchema,
    persistence,
    writeConfigToDisk
} from "../config.mjs";

const machineAPI = express.Router();
machineAPI.use(express.json());

machineAPI.route("/").get((req, res, next) => {
    log("Get all machines.", "Access", req.ip);
    res.send(configStorage.machines);
    next();
}).post((req, res) => {
    let validatedMachineConfig = machineSchema.validate(req.body);
    if (!validatedMachineConfig.error) {
        let duplicated = configStorage.machines.some(machine =>
            machine.macAddress === validatedMachineConfig.value.macAddress);
        if (!duplicated) {
            configStorage.machines.push(validatedMachineConfig.value);
            log(`New machine added, detail: ${JSON.stringify(validatedMachineConfig.value)}.`, "Access", req.ip);
            if (persistence) {
                writeConfigToDisk();
            } else {
                log("Configuration is not persistent, added machine will gone after a restart.", "Warning");
            }
            res.status(201);
            res.send(validatedMachineConfig.value);
        } else {
            log(`Failed to add a new machine (MAC address is not unique).`, "Access", req.ip);
            res.status(400);
            res.send({message: `Machine with MAC Address "${validatedMachineConfig.value.macAddress}" already exists.`});
        }
    } else {
        log(`Failed to add a new machine (validation error), detail: ${validatedMachineConfig.error.message}`, "Access");
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
            log(`Failed to ${
                req.method === "GET" ? "get" 
                    : req.method === "PUT" ? "update" : "delete"
            } the machine with MAC address "${macAddr}" (not existed).`, "Access", req.ip);
            res.status(404);
            res.send({message: "No such machine."});
        }
    } else {
        log(`Bad request received (wrong address format).`, "Access", req.ip);
        res.status(400);
        res.send({message: "Wrong MAC address format (Please use 12 hex digits without dots, colons and slashes)."});
    }
}).get((req, res, next) => {
    let macAddr = req.params["macAddr"].toLowerCase();
    log(`Get the machine with MAC address "${macAddr}".`, "Access", req.ip);
    res.send(configStorage.machines.filter(machine => machine.macAddress === macAddr)[0]);
    next();
}).put((req, res, next) => {
    let validatedMachineConfig = machineSchema.validate(req.body);
    if (!validatedMachineConfig.error) {
        configStorage.machines[configStorage.machines.findIndex(
            machine => machine.macAddress === req.params["macAddr"]
        )] = validatedMachineConfig.value;
        log(`Machine updated, detail: ${JSON.stringify(validatedMachineConfig.value)}.`, "Access", req.ip);
        if (persistence) {
            writeConfigToDisk();
        } else {
            log("Configuration is not persistent, Updated machine will gone after a restart.", "Warning");
        }
        res.send(validatedMachineConfig.value);
    } else {
        log(`Failed to update a machine (validation error), detail: ${validatedMachineConfig.error.message}`, "Access");
        res.status(400);
        res.send({message: validatedMachineConfig.error.message});
    }
    next();
}).delete((req, res) => {
    let macAddr = req.params["macAddr"].toLowerCase();
    configStorage.machines = configStorage.machines.filter(machine => machine.macAddress !== macAddr);
    log(`Machine "${macAddr}" is deleted.`, "Access");
    if (persistence) {
        writeConfigToDisk();
    }
    res.send({message: "Deleted."});
});

export {machineAPI};
