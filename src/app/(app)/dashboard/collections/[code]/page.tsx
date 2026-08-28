import { redirect } from "next/navigation";

export default async function DashboardCollectionRoute({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/dashboard?segment=${encodeURIComponent(code)}`);
}
