"use client";

import { useEffect, useState } from "react";

/**
 * Dev Helper Component - Only for development/testing
 * Set localStorage role for testing the AI Proposal Generator
 *
 * Usage: Add this component to your layout temporarily during development
 * <RoleSelectorPanel />
 */
export const RoleSelectorPanel = () => {
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setCurrentRole(role);
  }, []);

  const handleSetRole = (role: "freelancer" | "company") => {
    localStorage.setItem("userRole", role);
    setCurrentRole(role);
    window.location.href = "/ai-proposal-generator";
  };

  const handleClearRole = () => {
    localStorage.removeItem("userRole");
    setCurrentRole(null);
    window.location.href = "/";
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-800 border border-purple-500 rounded-lg p-4 w-64 shadow-xl">
      <h3 className="text-white font-semibold mb-3 text-sm">
        🧪 Dev Role Selector
      </h3>

      <div className="mb-3 p-2 bg-slate-700/50 rounded text-xs text-slate-300">
        Current Role:{" "}
        <span className="text-purple-400 font-semibold">
          {currentRole || "None"}
        </span>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => handleSetRole("freelancer")}
          className={`w-full px-3 py-2 rounded text-sm font-semibold transition-all ${
            currentRole === "freelancer"
              ? "bg-blue-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Set Freelancer
        </button>
        <button
          onClick={() => handleSetRole("company")}
          className={`w-full px-3 py-2 rounded text-sm font-semibold transition-all ${
            currentRole === "company"
              ? "bg-green-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          Set Company
        </button>
        <button
          onClick={handleClearRole}
          className="w-full px-3 py-2 rounded text-sm font-semibold bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
        >
          Clear Role (Logout)
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        💡 Tip: Open your browser DevTools to see localStorage values
      </p>
    </div>
  );
};
