import React from "react";

interface SectionShellProps {
  title?: string;
  description?: string;
  titleSize?: "sm" | "md" | "lg";
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function SectionShell({
  actions,
  children,
}: SectionShellProps) {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {actions && (
          <div className="flex justify-end mb-4">{actions}</div>
        )}
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
