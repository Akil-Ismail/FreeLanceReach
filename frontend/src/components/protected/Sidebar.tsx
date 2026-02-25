"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Zap,
  Briefcase,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  Users,
  MessageSquare,
} from "lucide-react";

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const FREELANCER_MENU = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Proposal Generator", href: "/ai-proposal-generator", icon: Zap },
  { name: "Job Matches", href: "/job-matches", icon: Briefcase },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Tasks", href: "/tasks", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI Coach", href: "/ai-coach", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

const COMPANY_MENU = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Post Job", href: "/post-job", icon: FileText },
  { name: "Applicants", href: "/applicants", icon: Users },
  { name: "Meetings", href: "/meetings", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar = ({ role, onLogout }: SidebarProps) => {
  const pathname = usePathname();
  const menu = role === "freelancer" ? FREELANCER_MENU : COMPANY_MENU;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">FreelanceReach</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
