export default function DiscoveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-primary))] text-slate-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
