import type { RegisterOptions } from "react-hook-form";

export type OtpFormValues = {
  code: string;
};

export const otpFieldRules: Record<keyof OtpFormValues, RegisterOptions<OtpFormValues>> = {
  code: {
    required: "Enter the 6-digit code",
    pattern: { value: /^\d{6}$/, message: "Enter all 6 digits" },
  },
};
