"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationCounts, LiveNotification } from "@/hooks/useNotificationCounts";
import { Sidebar } from "./Sidebar";
import { Bell, X } from "lucide-react";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const { userRole, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userId, setUserId] = useState(0);
  const [setupComplete, setSetupComplete] = useState(false);
  const [liveNotif, setLiveNotif] = useState<LiveNotification | null>(null);

  useEffect(() => {
    const id = Number(localStorage.getItem("userId") || 0);
    const complete = id
      ? localStorage.getItem(`profileSetupComplete:${id}`) === "true"
      : false;
    setUserId(id);
    setSetupComplete(complete);
  }, []);

  useEffect(() => {
    if (isLoading || !userRole) return;
    if (!setupComplete && pathname !== "/home/setup") {
      router.replace("/home/setup");
    }
  }, [isLoading, userRole, pathname, router, setupComplete]);

  // Dismiss popup after 5 seconds
  useEffect(() => {
    if (!liveNotif) return;
    const t = setTimeout(() => setLiveNotif(null), 5000);
    return () => clearTimeout(t);
  }, [liveNotif]);

  const onLiveNotification = useCallback((n: LiveNotification) => {
    setLiveNotif(n);
  }, []);

  const { counts, markSeen } = useNotificationCounts(userId, userRole, onLiveNotification);

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

  if (!setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <Sidebar role={userRole} onLogout={logout} counts={counts} markSeen={markSeen} />
      <main className="min-h-screen md:ml-64 pt-16 md:pt-14">{children}</main>

      {/* Live notification popup */}
      {liveNotif && (
        <div className="fixed top-5 right-5 z-50 flex items-start gap-3 bg-white border border-gray-200 shadow-lg rounded-2xl px-4 py-3 max-w-xs animate-in slide-in-from-top-2 duration-300">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-800">New Notification</p>
            <p className="text-xs text-gray-500 mt-0.5">{liveNotif.message}</p>
          </div>
          <button onClick={() => setLiveNotif(null)} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
