#!/usr/bin/env node

import express from "express";

import {api} from "./lib/api/index.mjs";

const app = express();

app.use("/api", api);

app.listen(3000, () => {});
