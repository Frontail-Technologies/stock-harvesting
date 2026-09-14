import type { RegisterOptions } from "react-hook-form";

export type ForgotPasswordFormValues = {
  email: string;
};

export const forgotPasswordFieldRules: Record<
  keyof ForgotPasswordFormValues,
  RegisterOptions<ForgotPasswordFormValues>
> = {
  email: { required: "Email is required" },
};
