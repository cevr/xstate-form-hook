import React from "react";
import ReactDOM from "react-dom";
import { setupWorker, rest } from "msw";

import "./tailwind.output.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const mockServer = setupWorker(
  rest.post("/login", (req, res, ctx) =>
    res(ctx.delay(2000), ctx.json(req.body))
  ),
  rest.post("/login-error", (_req, res, ctx) =>
    res(
      ctx.delay(2000),
      ctx.status(403),
      ctx.json({ message: "Something went wrong" })
    )
  )
);

mockServer.start({ quiet: true }).then(() => {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root")
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
