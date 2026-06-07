import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-500">
        Welcome back, {session?.user?.name ?? "User"}!
      </p>
      <p className="mt-1 text-sm text-gray-400">
        Your learning journey starts here.
      </p>
    </div>
  );
}
