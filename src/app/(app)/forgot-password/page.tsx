import type { Metadata } from "next";
import { ForgotPasswordScreen } from "@/features/auth";
import { SITE_NAME } from "@/utils/seo";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: `Reset your ${SITE_NAME} account password.`,
  alternates: {
    canonical: "/forgot-password",
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
