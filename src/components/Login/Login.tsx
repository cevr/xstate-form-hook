import * as React from "react";
import * as yup from "yup";
import clsx from "clsx";
import { gql, useMutation } from "@apollo/client";

import useForm from "useForm";

const validationSchema = yup.object().shape({
  username: yup.string().required("Please enter a username"),
  password: yup.string().required("Please enter a password"),
});

const loginMutation = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      username
    }
  }
`;

interface LoginResponse {
  username: string;
  id: string;
}

interface LoginData {
  login: LoginResponse;
}

interface LoginVariables {
  username: string;
  password: string;
}

const initialValues = {
  username: "",
  password: "",
  shouldError: false,
};

function Login() {
  const [login] = useMutation<LoginData, LoginVariables>(loginMutation);

  const { errors, getInputProps, submit, matches } = useForm<
    typeof initialValues,
    LoginResponse | undefined
  >({
    initialValues,
    validationSchema,
    onSubmit: (values) =>
      login({
        variables: values,
      })
        .then((res) => res.data?.login)
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
            <FormInput
              {...getInputProps("shouldError")}
              label="Throw error in sign up"
              type="checkbox"
            />
          </div>
          <div className="mb-4">
            <FormInput
              {...getInputProps("username")}
              label="Username"
              placeholder="Username"
              type="text"
              errorText={errors.username}
            />
          </div>
          <div className="mb-6">
            <FormInput
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

export default Login;

interface TextInputProps extends React.HTMLProps<HTMLInputElement> {
  errorText?: string;
  label: string;
}

const FormInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ errorText, label, ...props }, ref) {
    const hasError = Boolean(errorText);
    const isCheckbox = props.type === "checkbox";

    return (
      <>
        <label
          className={clsx("block text-gray-700 text-sm font-bold", {
            "text-red-500": hasError,
            "mb-2": !isCheckbox,
            "mr-2": isCheckbox,
          })}
          htmlFor={props.id}
        >
          {label}
        </label>
        {props.type === "checkbox" ? (
          <input {...props} ref={ref} />
        ) : (
          <input
            className={clsx(
              "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline",
              {
                "border-red-500": hasError,
              }
            )}
            {...props}
            ref={ref}
          />
        )}
        {hasError ? <ErrorText>{errorText}</ErrorText> : null}
      </>
    );
  }
);

interface ErrorTextProps {
  children: React.ReactNode;
}

function ErrorText({ children }: ErrorTextProps) {
  return <p className="text-red-500 text-xs font-bold">{children}</p>;
}
