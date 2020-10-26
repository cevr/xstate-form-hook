import * as React from "react";
import * as yup from "yup";
import clsx from "clsx";

import useForm from "./useForm";

const validationSchema = yup.object().shape({
  username: yup.string().required("Please enter a username"),
  password: yup.string().required("Please enter a password"),
});

function App() {
  const [shouldError, setShouldError] = React.useState(false);
  const { errors, getInputProps, submit, matches } = useForm({
    initialValues: {
      username: "",
      password: "",
    },
    validationSchema,
    onSubmit: (values) =>
      fetch(shouldError ? "/login-error" : "/login", {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (res.status !== 200) {
            throw new Error("Something went wrong!");
          }
          return res.json();
        })
        .catch(() => Promise.reject(new Error("Something went wrong!"))),
    afterSubmit: (_values, event) => {
      console.log("Signed in with ", event.data);
    },
  });

  return (
    <main className="w-screen h-screen flex justify-center items-center bg-gray-300">
      <div className="w-full max-w-xs">
        <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4 flex items-center">
            <label
              className="text-gray-700 text-sm font-bold mr-2"
              htmlFor="errorCheck"
            >
              Throw error in sign in response
            </label>
            <input
              id="errorCheck"
              type="checkbox"
              onChange={(event) => {
                const shouldError = event.target.checked;
                setShouldError(shouldError);
              }}
              value={String(shouldError)}
            />
          </div>
          <div className="mb-4">
            <TextInput
              {...getInputProps("username")}
              label="Username"
              placeholder="Username"
              type="text"
              errorText={errors.username}
            />
          </div>
          <div className="mb-6">
            <TextInput
              {...getInputProps("password")}
              label="Password"
              type="password"
              placeholder="******************"
              errorText={errors.password}
            />
          </div>
          <div className="flex items-center justify-between">
            {matches("submitted") ? (
              <p className="text-green-500">Successfuly signed in!</p>
            ) : (
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={submit}
              >
                {matches("submitting") ? "Loading..." : "Sign In"}
              </button>
            )}

            {errors.submit ? <ErrorText>{errors.submit}</ErrorText> : null}
          </div>
        </form>
      </div>
    </main>
  );
}

export default App;

interface TextInputProps extends React.HTMLProps<HTMLInputElement> {
  errorText?: string;
  label: string;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ errorText, label, ...props }, ref) {
    return (
      <>
        <label
          className="block text-gray-700 text-sm font-bold mb-2"
          htmlFor={props.id}
        >
          {label}
        </label>
        <input
          className={clsx(
            "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline",
            {
              "border-red-500": errorText,
            }
          )}
          {...props}
          ref={ref}
        />
        {errorText ? <ErrorText>{errorText}</ErrorText> : null}
      </>
    );
  }
);

interface ErrorTextProps {
  children: React.ReactNode;
}

function ErrorText({ children }: ErrorTextProps) {
  return <p className="text-red-500 text-xs">{children}</p>;
}
