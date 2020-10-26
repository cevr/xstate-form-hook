import { setupServer } from "msw/node";

import { getHandler } from "./handler";

export const server = setupServer(getHandler(100));
