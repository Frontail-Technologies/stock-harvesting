import type { RegisterOptions } from "react-hook-form";

export type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export const resetPasswordFieldRules: Record<
  keyof ResetPasswordFormValues,
  RegisterOptions<ResetPasswordFormValues>
> = {
  password: {
    required: "Password is required",
    minLength: { value: 8, message: "Password must be at least 8 characters" },
  },
  confirmPassword: {
    required: "Please confirm your password",
  },
};
