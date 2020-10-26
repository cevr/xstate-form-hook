import * as React from "react";
import { useMachine } from "@xstate/react";

import createFormMachine, {
  FormMachineEventTypes,
  FormElement,
  ValidationSchema,
} from "./machines/form";

type UseFormOptions<InitialValues extends object, OnSubmitResponse> = {
  initialValues: InitialValues;
  validationSchema: ValidationSchema;
  onSubmit: (values: InitialValues) => Promise<OnSubmitResponse>;
  afterSubmit?: (
    values: InitialValues,
    event: { data: OnSubmitResponse }
  ) => void;
};

function useForm<InitialValues extends object, OnSubmitResponse>({
  initialValues,
  validationSchema,
  afterSubmit,
  onSubmit,
}: UseFormOptions<InitialValues, OnSubmitResponse>) {
  // creates a map of react refs
  // each ref will be defined with an input when getInputProps() is used
  const elementRefMap = React.useMemo(
    () =>
      Object.keys(initialValues).reduce((refMap, key) => {
        refMap[key] = React.createRef<FormElement>();
        return refMap;
      }, {} as Record<string, React.RefObject<FormElement>>),
    [initialValues]
  );

  const formMachine = React.useMemo(() => createFormMachine(), []);

  const [state, send] = useMachine(formMachine, {
    context: {
      // assign initial context
      values: initialValues,
      refs: elementRefMap,
      errors: {},
      validationSchema,
    },
    services: {
      onSubmit: (context) => onSubmit(context.values as InitialValues),
    },
    actions: {
      afterSubmit: (context, event) =>
        afterSubmit?.(context.values as InitialValues, event),
    },
  });

  // handy dandy function to assign handlers and set ref
  function getInputProps(
    name: Extract<keyof InitialValues, string>,
    options: {
      refProp?: string;
    } = {}
  ) {
    return {
      name,
      id: `use-form-${name}`,
      onChange: (
        event: React.ChangeEvent<FormElement> | React.FormEvent<FormElement>
      ) => {
        const target = event.target as FormElement;
        send({
          name,
          type: FormMachineEventTypes.CHANGE,
          value:
            target.type === "checkbox"
              ? (target as HTMLInputElement).checked
              : target.value,
        });
      },
      onBlur: (event: React.FocusEvent<FormElement>) => {
        send({
          name,
          type: FormMachineEventTypes.BLUR,
          value: event.target.value,
        });
      },
      [options.refProp ?? "ref"]: state.context.refs[name],
      value: state.context.values[name],
    };
  }

  return {
    values: state.context.values,
    errors: state.context.errors,
    matches: state.matches,
    state: state.value,
    send,
    getInputProps,
    // for when you dont want to assume the fields value
    setField: (fieldProps: {
      value: unknown;
      name: Extract<keyof InitialValues, string>;
    }) => {
      send({
        type: FormMachineEventTypes.CHANGE,
        ...fieldProps,
      });
    },
    submit: () => {
      send("SUBMIT");
    },
  };
}

export default useForm;
