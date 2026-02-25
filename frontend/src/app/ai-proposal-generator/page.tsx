"use client";

import { useAuth } from "@/hooks/useAuth";
import { ProtectedLayout } from "@/components/protected/ProtectedLayout";
import { AIProposalGenerator } from "@/components/ai-proposal-generator/AIProposalGenerator";

export default function AIProposalGeneratorPage() {
  const { userRole, isLoading } = useAuth();

  if (isLoading || !userRole) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedLayout>
      <AIProposalGenerator userRole={userRole} />
    </ProtectedLayout>
  );
}
