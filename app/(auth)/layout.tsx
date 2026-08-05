export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground mb-3">
            <span className="text-sm font-bold">IP</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">IndexPilot</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie a indexação dos seus sites</p>
        </div>
        {children}
      </div>
    </div>
  );
}
