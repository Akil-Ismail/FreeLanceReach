"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import logo from "../../../public/logo1.png";
import { UserRole } from "@/hooks/useAuth";
import { NotificationCounts } from "@/hooks/useNotificationCounts";
import {
  Home,
  User,
  FileText,
  MessageSquare,
  Layers3,
  CheckCircle2,
  CalendarDays,
  Bell,
  ScrollText,
  ListChecks,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
  counts?: NotificationCounts;
  markSeen?: (section: keyof NotificationCounts | "all") => void;
}

type NavItem = {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const COMMON_ITEMS: NavItem[] = [
  { name: "Profile", href: "/home/profile", icon: User },
  { name: "Job Proposal", href: "/home/proposal", icon: FileText },
  { name: "Chatbot", href: "/home/chatbot", icon: MessageSquare },
  { name: "Matching", href: "/home/matching", icon: Layers3 },
  { name: "Approvals", href: "/home/approvals", icon: CheckCircle2 },
  { name: "Meeting", href: "/home/meeting", icon: CalendarDays },
  { name: "Notifications", href: "/home/notifications", icon: Bell },
  { name: "Contracts", href: "/home/contracts", icon: ScrollText },
  { name: "Tasks", href: "/home/tasks", icon: ListChecks },
];

const BADGE_KEYS: Record<string, keyof NotificationCounts> = {
  "/home/approvals": "approvals",
  "/home/meeting": "meetings",
  "/home/notifications": "notifications",
};

const SECTION_MAP: Record<string, keyof NotificationCounts | "all"> = {
  "/home/approvals": "approvals",
  "/home/meeting": "meetings",
  "/home/notifications": "all",
};

export const Sidebar = ({ role, onLogout, counts, markSeen }: SidebarProps) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const homePath = role === "company" ? "/home/employer" : "/home/freelancer";

  const navItems = useMemo<NavItem[]>(() => {
    const items = COMMON_ITEMS.map((item) =>
      item.href === "/home/proposal" && role === "freelancer"
        ? { ...item, name: "Jobs" }
        : item
    );
    return [{ name: "Home", href: homePath, icon: Home }, ...items];
  }, [homePath, role]);

  const NavContent = ({ closeOnClick = false }: { closeOnClick?: boolean }) => (
    <>
      <div className="p-5 border-b border-gray-100">
        <Link
          href={homePath}
          className="flex items-center"
          onClick={() => closeOnClick && setMobileOpen(false)}
        >
          <Image
            src={logo}
            alt="FreelanceReach Logo"
            className="h-14 w-auto"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                closeOnClick && setMobileOpen(false);
                const section = SECTION_MAP[item.href];
                if (section && markSeen) markSeen(section);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-red-50 hover:text-red-700"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-semibold flex-1">{item.name}</span>
              {(() => {
                const key = BADGE_KEYS[item.href];
                const n = key && counts ? counts[key] : 0;
                return n > 0 ? (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${isActive ? "bg-white text-red-600" : "bg-red-600 text-white"}`}>
                    {n > 99 ? "99+" : n}
                  </span>
                ) : null;
              })()}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>
    </>
  );

  const currentPage = navItems.find((item) => pathname === item.href)?.name ?? "";

  return (
    <>
      {/* Mobile top bar — hamburger | page name | logo */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {currentPage && (
            <span className="text-sm font-semibold text-gray-800">{currentPage}</span>
          )}
        </div>
        <Link href={homePath} className="flex items-center">
          <Image src={logo} alt="FreelanceReach Logo" className="h-10 w-auto" priority />
        </Link>
      </header>

      {/* Desktop top bar */}
      <header className="hidden md:flex fixed top-0 left-64 right-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 h-14 px-6 items-center">
        {currentPage && (
          <span className="text-sm font-semibold text-gray-800">{currentPage}</span>
        )}
      </header>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-16 md:top-0 left-0 z-40 h-[calc(100vh-4rem)] md:h-screen w-72 md:w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <NavContent closeOnClick />
      </aside>
    </>
  );
};
