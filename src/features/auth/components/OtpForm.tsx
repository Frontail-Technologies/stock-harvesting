"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { otpFieldRules, type OtpFormValues } from "../schemas/otp.schema";

type OtpFormProps = {
  pending: boolean;
  isSubmitting: boolean;
  isResending: boolean;
  onSubmit: (values: OtpFormValues) => void | Promise<void>;
  onResend: () => Promise<boolean>;
};

export function OtpForm({ pending, isSubmitting, isResending, onSubmit, onResend }: OtpFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OtpFormValues>({ defaultValues: { code: "" } });

  const code = useWatch({ control, name: "code" });

  async function handleResendClick() {
    const success = await onResend();
    if (success) reset({ code: "" });
  }

  return (
    <form className="mt-4 space-y-2.5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <Controller
          name="code"
          control={control}
          rules={otpFieldRules.code}
          render={({ field }) => (
            <Input
              inputMode="numeric"
              pattern="[0-9]{6}"
              placeholder="6-digit code"
              className="h-10 px-3 text-sm"
              name={field.name}
              value={field.value}
              onChange={(event) =>
                field.onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        {errors.code && (
          <p className="mt-1 text-[11px] text-destructive">{errors.code.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="h-10 w-full cursor-pointer text-[13px] font-bold"
        disabled={pending || code.length !== 6}
      >
        {isSubmitting ? <Spinner size="sm" /> : null}
        Verify
      </Button>
      <p className="pt-2 text-center text-[13px] text-landing-text-secondary">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          className="cursor-pointer font-semibold text-landing-fg underline-offset-4 hover:text-brand-gold hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleResendClick}
          disabled={pending || isResending}
        >
          Resend
        </button>
      </p>
    </form>
  );
}
