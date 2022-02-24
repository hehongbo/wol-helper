#!/usr/bin/env node

import express from "express";

import {api} from "./lib/api/index.mjs";
import {log} from "./lib/log.mjs";

const app = express();
const listenPort = 3000;

app.use("/api", api);

log(`Listening on port ${listenPort} ...`, "Info");
app.listen(listenPort, () => {});
