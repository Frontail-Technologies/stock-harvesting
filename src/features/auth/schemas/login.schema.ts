import type { RegisterOptions } from "react-hook-form";

export type LoginFormValues = {
  email: string;
  password: string;
};

export const loginFieldRules: Record<
  keyof LoginFormValues,
  RegisterOptions<LoginFormValues>
> = {
  email: { required: "Email is required" },
  password: { required: "Password is required" },
};
