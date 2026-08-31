#!/usr/bin/env node
import { report } from "./validate";

const { hasErrors } = report();
process.exit(hasErrors ? 1 : 0);
