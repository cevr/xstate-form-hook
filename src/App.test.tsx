import * as React from "react";
import { render, fireEvent } from "@testing-library/react";
import { rest } from "msw";

import App from "./App";
import { server } from "./mockServer";

// used to provide a next tick when needed
const nextTick = (ms?: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function renderApp() {
  return render(<App />);
}

describe("<App />", () => {
  it("renders", () => {
    renderApp();
  });

  it("displays validation error messages", async () => {
    const screen = renderApp();

    const submitButton = screen.getByText("Sign In");

    fireEvent.click(submitButton);

    const usernameValidationMessage = await screen.findByText(
      /enter a username/i
    );
    const passwordValidationMessage = await screen.findByText(
      /enter a password/i
    );

    expect(usernameValidationMessage).toBeInTheDocument();
    expect(passwordValidationMessage).toBeInTheDocument();
  });

  it("displays a loading state when signing in", async () => {
    server.use(
      rest.post("/login", (req, res, ctx) =>
        res(ctx.delay(100), ctx.status(200), ctx.json(req.body))
      )
    );

    const screen = renderApp();
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByText("Sign In");

    fireEvent.change(usernameInput, { target: { value: "dev" } });
    fireEvent.change(passwordInput, { target: { value: "dev" } });

    fireEvent.click(submitButton);

    expect(await screen.findByText(/loading/i)).toBeInTheDocument();
  });

  it("displays a sucess state when successfuly signed in", async () => {
    const screen = renderApp();
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByText("Sign In");

    fireEvent.change(usernameInput, { target: { value: "dev" } });
    fireEvent.change(passwordInput, { target: { value: "dev" } });

    fireEvent.click(submitButton);

    expect(
      await screen.findByText(/Successfuly signed in/i)
    ).toBeInTheDocument();
  });

  it("displays an error message when sign in fails", async () => {
    const screen = renderApp();

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByText("Sign In");

    fireEvent.change(usernameInput, { target: { value: "dev" } });
    fireEvent.change(passwordInput, { target: { value: "dev" } });

    fireEvent.click(screen.getByLabelText(/throw error/i));
    // ensures that the setShouldError is comitted
    await nextTick();

    fireEvent.click(submitButton);

    expect(await screen.findByText(/went wrong/i)).toBeInTheDocument();
  });
});
