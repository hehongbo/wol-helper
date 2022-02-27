#!/usr/bin/env node

import express from "express";

import {api} from "./lib/api/index.mjs";
import {log} from "./lib/log.mjs";

import {configStorage} from "./lib/config.mjs";

const app = express();
app.use("/api", api);
app.use("/", express.static("front"));

log(`Listening on port ${configStorage.listenPort} ...`, "Info");
app.listen(configStorage.listenPort, () => {});
