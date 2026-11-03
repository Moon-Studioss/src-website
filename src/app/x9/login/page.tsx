import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Admin Login — SRC e-solutions",
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[var(--paper-2)] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="pop text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight"><span className="bg-[var(--hi)] px-2 py-0.5 rounded-md">SRC</span> <span className="font-normal">e-solutions</span></h1>
          <p className="text-sm text-[var(--mute)] mt-1">Admin Dashboard</p>
        </div>
        
        <div className="pop bg-white border border-t-4 rounded-2xl p-8 shadow-sm" style={{ borderColor: "var(--rule)", borderTopColor: "var(--hi)", animationDelay: "60ms" }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
