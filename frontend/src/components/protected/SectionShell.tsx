import React from "react";

interface SectionShellProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function SectionShell({
  title,
  description,
  actions,
  children,
}: SectionShellProps) {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {title}
            </h1>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
