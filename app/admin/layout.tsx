import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, isAdmin } from "@/lib/auth";

export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-serif text-2xl mb-2">Not authorised</h1>
        <p className="text-neutral-600">
          This area is restricted. Signed in as {user.email}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex gap-4 border-b border-neutral-200 pb-3 text-sm">
        <Link href="/admin" className="hover:underline">
          Add art
        </Link>
        <Link href="/admin/orders" className="hover:underline">
          Orders
        </Link>
      </div>
      {children}
    </div>
  );
}
