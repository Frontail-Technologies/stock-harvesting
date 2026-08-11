import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth";
import { SITE_NAME } from "@/utils/seo";

export const metadata: Metadata = {
  title: "Login",
  description: `Sign in to ${SITE_NAME} with Google.`,
  alternates: {
    canonical: "/login",
  },
};

export default function LoginPage() {
  return <LoginScreen />;
}
