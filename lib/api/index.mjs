import express from "express";

import {machineAPI} from "./machine.mjs";
import {wakeAPI} from "./wake.mjs";

const api = express.Router();
api.use("/machine", machineAPI);
api.use("/wake", wakeAPI);

export {api};
