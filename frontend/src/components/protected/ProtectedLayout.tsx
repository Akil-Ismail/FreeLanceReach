"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const { userRole, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || !userRole) return;

    const userId = localStorage.getItem("userId");
    const complete = userId
      ? localStorage.getItem(`profileSetupComplete:${userId}`) === "true"
      : false;

    if (!complete && pathname !== "/home/setup") {
      router.replace("/home/setup");
    }
  }, [isLoading, userRole, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userRole) return null;

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  const setupComplete = userId
    ? localStorage.getItem(`profileSetupComplete:${userId}`) === "true"
    : false;

  // During setup, show minimal layout — no sidebar navigation
  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <Sidebar role={userRole} onLogout={logout} />
      <main className="min-h-screen md:ml-64 pt-16 md:pt-0">{children}</main>
    </div>
  );
};
