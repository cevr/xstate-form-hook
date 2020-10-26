import { setupServer } from "msw/node";
import { rest } from "msw";

export const server = setupServer(
  rest.post("/login", (req, res, ctx) => res(ctx.json(req.body))),
  rest.post("/login-error", (_req, res, ctx) =>
    res(ctx.status(403), ctx.json({ message: "Something went wrong" }))
  )
);