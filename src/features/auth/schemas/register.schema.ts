import type { RegisterOptions } from "react-hook-form";

export type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
};

export const registerFieldRules: Record<
  keyof RegisterFormValues,
  RegisterOptions<RegisterFormValues>
> = {
  name: {
    required: "Name is required",
    minLength: { value: 2, message: "Name is too short" },
  },
  email: { required: "Email is required" },
  password: {
    required: "Password is required",
    minLength: { value: 8, message: "Password must be at least 8 characters" },
  },
};
