import { setupWorker } from "msw";

import { getHandler } from "./handler";

export const server = setupWorker(getHandler(2000));
