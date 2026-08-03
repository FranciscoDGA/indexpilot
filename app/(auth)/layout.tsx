export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">IndexPilot</h1>
          <p className="text-sm text-muted-foreground">Gerencie a indexação dos seus sites</p>
        </div>
        {children}
      </div>
    </div>
  );
}
