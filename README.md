# WoL Helper

![npm version](https://img.shields.io/npm/v/wol-helper)

A simple server application that allows you to perform Wake-on-LAN remotely with a web interface.

## Usage

Install:

```shell
npm install -g wol-helper
```

Then run:

```shell
wol-helper /path/to/config.json
```

That will start the web (and API) server, which by default listens on TCP port 3000 but can be modified in the configuration file.

The application will create the configuration file if not exist. However, the server will run without persistent storage if started without the path parameter:

```shell
wol-helper
```

At which point it's still functional, but all machines will be lost once restarted.

For users who want to run it with Docker, remember to use the host network:

```shell
docker run -d \
    --name wol-helper \
    --net host \
    -v /your_path/wol-helper:/usr/local/etc/wol-helper \
    --restart unless-stopped \
    hehongbo/wol-helper
```

## Configuration

```json
{
  "listenPort": 3000,
  "machines": [
    {
      "name": "example",
      "macAddress": "aabbccddeeff",
      "ipAddress": "192.168.0.11/24"
    }
  ],
  "defaultSubnet": "192.168.0.0/24",
  "magicPacketUDP": 9,
  "sendUnicast": false
}
```

- `listenPort` (integer, default to `3000`): TCP port to listen to.
- `machines` (array, default to `[]`) : Information of each machine.
  - (object)
    - `name` (string): Name of the machine.
    - `macAddress` (string, **required**): MAC address of the machine. \
      The application use 12-bit hex numbers without separator, though `aa:bb:cc:dd:ee:ff` (most commonly used), `aa-bb-cc-dd-ee-ff` (commonly seen on Windows devices), and `aabb:ccdd:eeff` (commonly seen on switches/routers) are accepted.
    - `ipAddress` (string): IP address (in CIDR) of the machine. \
      Though not required, it's recommended to fill in this value since the application will use this to determine which subnet to send the magic packet to. \
      Please provide IP addresses in CIDR form (like `192.168.0.11/24`). Addresses without subnet length will be rejected.
- `defaultSubnet` (string) \
  Default subnet to which the application will broadcast magic packets if the machine's `ipAddress` is not defined. However, if this is also not defined, magic packets will be sent to `255.255.255.255`.
- `magicPacketUDP` (integer, default to `9`): The UDP port to send magic packets to. 
- `sendUnicast` (boolean, default to `false`) \
  Once set, the application will send magic packets to a specific IP address instead of broadcast addresses like `192.168.0.255`. This is usually both unnecessary and not recommended since ARP records on the machine/switches/routers are likely to expire after the machine is turned off for a while, thus the magic packet simply cannot reach.

> Note that configuration format might change before version 1.0.

## API

### Wake a machine

```http request
POST /api/wake/aabbccddeeff
```

This will send a magic packet which wakes `aa:bb:cc:dd:ee:ff` to:
- It's broadcast address (If the machine was added in the configuration before, with `ipAddress` field properly defined).
- The broadcast address of `defaultSubnet` (If the machine was not added before).
- `255.255.255.255` (If `defaultSubnet` is also not defined).

Note that we only accept 12-bit hex here. Separators are not allowed.

Response: 
- `200 OK` Magic packet sent successfully (This does not mean the machine is waked up successfully).
- `400 Bad Request` MAC address is not provided in the right format.

### Add a new machine

```http request
POST /api/machine
```

Request body:
```json
{
  "name": "example",
  "macAddress": "aabbccddeeff",
  "ipAddress": "192.168.0.11/24"
}
```

Response:
- `201 Created` The machine is added.
- `400 Bad Request`
  - Another Machine with this MAC address already exists.
  - Invalid information is provided in the request body.

### Get a machine's information

```http request
GET /api/machine/aabbccddeeff
```

Response:
- `200 OK` with the machine's information returned in JSON format.
- `400 Bad Request` MAC address is not provided with the right format.
- `404 Not Found` Machine with that MAC address does not exist.

### Get all machines' information

```http request
GET /api/machine
```

Response: `200 OK` with all machines' information returned as a JSON array.

### Update a machine's information

```http request
PUT /api/machine/aabbccddeeff
```

Request body:
```json
{
  "name": "example",
  "macAddress": "aabbccddeeff",
  "ipAddress": "192.168.0.11/24"
}
```

Note that `macAddress` field is also required here, which you should fill in the same address if you update something else besides macAddress. Filling in a different address will result in the machine's MAC address being changed, and you will need to call the API with the new address next time you want to wake/update/delete it.

Response:
- `200 OK` with the machine's updated information returned in JSON format.
- `400 Bad Request` 
  - MAC address is not provided with the right format.
  - Invalid information is provided in the request body.
- `404 Not Found` Machine with that MAC address does not exist.

### Delete a machine

```http request
DELETE /api/machine/aabbccddeeff
```

Response:
- `200 OK` The machine is deleted.
- `400 Bad Request` MAC address is not provided in the right format.
- `404 Not Found` Machine with that MAC address does not exist.
