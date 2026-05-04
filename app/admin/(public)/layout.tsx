export default function AdminPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50 px-4 py-8">{children}</div>;
}
