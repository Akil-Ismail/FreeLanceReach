"use client";

import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const { userRole, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar role={userRole} onLogout={logout} />
      <main className="flex-1 ml-64 overflow-auto bg-slate-950">
        {children}
      </main>
    </div>
  );
};
