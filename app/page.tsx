import { EmployeeSubmissionForm } from "@/components/EmployeeSubmissionForm";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <div className="text-sm font-semibold text-slate-900">Mployee</div>
        <Link
          href="/admin/login"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          Admin
        </Link>
      </div>
      <EmployeeSubmissionForm />
    </div>
  );
}
