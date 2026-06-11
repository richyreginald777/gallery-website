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
      <div className="page">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-3 font-serif text-3xl text-ink">Not authorised</h1>
          <p className="text-muted">
            This area is restricted. Signed in as {user.email}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mb-8 flex items-center gap-6 border-b border-line pb-4 text-sm">
        <span className="eyebrow">Studio</span>
        <Link href="/admin" className="text-muted transition-colors hover:text-accent">
          Add art
        </Link>
        <Link href="/admin/orders" className="text-muted transition-colors hover:text-accent">
          Orders
        </Link>
      </div>
      {children}
    </div>
  );
}
