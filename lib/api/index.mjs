import express from "express";

import {machineAPI} from "./machine.mjs";

const api = express.Router();
api.use("/machine", machineAPI);

export {api};
