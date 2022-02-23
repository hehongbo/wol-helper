import express from "express";

import {magicPacket} from "../magic-packet.mjs";
import {getBroadcastAddress} from "../cidr.mjs";
import {configStorage} from "../config.mjs";

const wakeAPI = express.Router();

wakeAPI.route("/:macAddr/").post((req, res) => {
    let macAddr = req.params["macAddr"].toLowerCase();
    if (macAddr.search(/([0-9]|[a-f]){12}$/) === 0) {
        let ipAddress;
        if (configStorage.machines.some(machine => machine.macAddress === macAddr)) {
            ipAddress = configStorage.machines.filter(machine => machine.macAddress === macAddr)[0].ipAddress;
        }
        if (ipAddress) {
            if (!configStorage.sendUnicast) {
                magicPacket(macAddr, getBroadcastAddress(ipAddress), configStorage.magicPacketUDP);
            } else {
                magicPacket(macAddr, ipAddress.split("/")[0], configStorage.magicPacketUDP, false);
            }
        } else {
            if (configStorage.defaultSubnet) {
                magicPacket(macAddr, getBroadcastAddress(configStorage.defaultSubnet), configStorage.magicPacketUDP);
            } else {
                magicPacket(macAddr, "255.255.255.255", configStorage.magicPacketUDP);
            }
        }
        res.send({message: `Magic packet sent to "${macAddr}".`});
    } else {
        res.status(400);
        res.send({message: "Wrong MAC address format (Please use 12 hex digits without dots, colons and slashes)."});
    }
});

export {wakeAPI}
