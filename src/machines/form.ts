import * as React from "react";
import * as yup from "yup";
import * as x from "xsfp";

export type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export type ValidationSchema = yup.ObjectSchema<
  yup.Shape<object | undefined, Record<string, any>>
>;

export interface FormMachineContext {
  values: Record<string, any>;
  errors: Record<string, string> & { submit?: string };
  refs: Record<string, React.RefObject<FormElement>>;
  validationSchema: ValidationSchema;
}

export type FormMachineError = {
  [inputName: string]: string;
};

export enum FormMachineEventTypes {
  BLUR = "BLUR",
  CHANGE = "CHANGE",
  SUBMIT = "SUBMIT",
}

const hasErrors = x.guard<FormMachineContext>((context) =>
  Object.values(context.errors).some(Boolean)
);

const setValue = x.assign<FormMachineContext>({
  values: (context, event) => ({
    ...context.values,
    [event.name]: event.value,
  }),
});

const setErrors = x.assign<FormMachineContext>({
  errors: (context, event) => ({
    ...context.errors,
    ...event.data,
  }),
});

const resetError = x.assign<FormMachineContext>({
  errors: (context, event) => {
    // if the input doesnt have an error, no need to reset it
    if (!context.errors[event.name]) return context.errors;
    return {
      ...context.errors,
      [event.name]: undefined,
    } as any;
  },
});

const resetErrors = x.assign<FormMachineContext>({ errors: {} });

const focusInput = x.effect<FormMachineContext>((context, event): void => {
  // this will look at the first input and focus it for some pleasant UX
  const [firstKey] = Object.keys(event.data);
  context.refs[
    firstKey as Extract<keyof typeof context.values, string>
  ].current?.focus();
});

const setSubmitError = x.assign({
  errors: (context, event: any) => ({
    ...context.errors,
    submit: event.data.message,
  }),
});

const onChangeActions = x.merge<FormMachineContext>(resetError, setValue);

// see state-chart here https://xstate.js.org/viz/?gist=f2f83bbd2ba3bd2ba1d9b9153abcaaf3
const createFormMachine = () =>
  x.createMachine<FormMachineContext>(
    x.states(
      x.initialState(
        "idle",
        x.states("noError", "error"),
        x.on(
          FormMachineEventTypes.CHANGE,
          x.transition("idle.error", onChangeActions, hasErrors),
          x.transition("idle.noError", onChangeActions)
        ),
        x.on(FormMachineEventTypes.BLUR, "validatingField"),
        x.on(FormMachineEventTypes.SUBMIT, "validating")
      ),
      x.state(
        "validatingField",
        x.invoke(
          (context, event) => {
            const field = event.name;
            return new Promise<void>((resolve, reject) =>
              yup
                .reach(context.validationSchema, field)
                .validate(event.value)
                .then(
                  () => resolve(),
                  (error: yup.ValidationError) =>
                    reject({ [field]: error.message })
                )
            );
          },
          x.onDone("idle.noError"),
          x.onError("idle.error", setErrors)
        )
      ),
      x.state(
        "validating",
        x.entry(resetErrors),
        x.invoke(
          (context) =>
            new Promise<void>((resolve, reject) =>
              // when validating the whole form, make sure we don't abort early to receive full list of errors
              context.validationSchema
                .validate(context.values, {
                  abortEarly: false,
                })
                .then(
                  () => resolve(),
                  (error: yup.ValidationError) => reject(yupToFormErrors(error))
                )
            ),
          x.onDone("submitting"),
          x.onError("idle.error", setErrors, focusInput)
        )
      ),
      x.state(
        "submitting",
        x.invoke(
          "onSubmit",
          x.onDone("submitted", x.action("afterSubmit")),
          x.onError("idle.error", setSubmitError)
        )
      ),
      x.finalState("submitted")
    )
  );

export default createFormMachine;

// yup errors are kind of weird
// create a simple object like so { [inputName]: inputError }
function yupToFormErrors(yupError: yup.ValidationError): FormMachineError {
  if (yupError.inner) {
    if (yupError.inner.length === 0) {
      return { [yupError.path]: yupError.message };
    }
    return Object.fromEntries(
      yupError.inner.map((err) => [err.path, err.message])
    );
  }
  return {};
}
