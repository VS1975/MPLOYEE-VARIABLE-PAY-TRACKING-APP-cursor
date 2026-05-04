import { signOut } from "@/app/admin/actions";
import Link from "next/link";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-900">
            <Link href="/admin/dashboard" className="hover:text-blue-700">
              Dashboard
            </Link>
            <Link
              href="/admin/settings"
              className="font-normal text-slate-600 hover:text-blue-700"
            >
              Pay rules
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-600 hover:text-blue-700">
              Employee form
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
