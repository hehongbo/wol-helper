import dgram from "dgram";

export function magicPacket(macAddr, ipAddr, port, sendAsBroadcast = true) {
    let macAddrArray = new Uint8Array(6);
    for (let i = 0; i < 6; i++) {
        macAddrArray[i] = parseInt(macAddr.slice(i * 2, i * 2 + 2), 16);
    }

    let packetData = new Uint8Array(102);
    packetData.set([255, 255, 255, 255, 255, 255], 0);
    for (let i = 1; i <= 16; i++) {
        packetData.set(macAddrArray, 6 * i);
    }

    let socket = dgram.createSocket('udp4');
    if (sendAsBroadcast) {
        socket.bind(() => {
            socket.setBroadcast(true);
        });
    }
    socket.send(packetData, 0, 102, port, ipAddr, () => socket.close());
}
