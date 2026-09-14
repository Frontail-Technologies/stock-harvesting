import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordScreen } from "@/features/auth";
import { SITE_NAME } from "@/utils/seo";

export const metadata: Metadata = {
  title: "Reset Password",
  description: `Set a new password for your ${SITE_NAME} account.`,
  alternates: {
    canonical: "/reset-password",
  },
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
