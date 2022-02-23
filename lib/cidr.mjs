export function getBroadcastAddress(cidr) {
    let address = new Uint8Array(cidr.split("/")[0].split("."));

    let maskLength = cidr.split("/")[1];
    let maskBinary = "1".repeat(maskLength) + "0".repeat(32 - maskLength);
    let netmask = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
        netmask[i] = parseInt(maskBinary.slice(i * 8, i * 8 + 8), 2);
    }

    let broadcastAddress = new Uint8Array(4);
    for (let i = 0; i < 4; i++) {
        broadcastAddress[i] = (address[i] & netmask[i]) | (~netmask[i]);
    }

    return broadcastAddress.join(".");
}
