#!/usr/bin/env node
/**
 * aiko-boot-create CLI
 * Create a new aiko-boot scaffold project (monorepo: api, admin, mobile, shared[, shared-auth]).
 */
import { createCommand } from './create.js';

createCommand();
