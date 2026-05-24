import React from "react";

interface SectionShellProps {
  title: string;
  description?: string;
  titleSize?: "sm" | "md" | "lg";
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function SectionShell({
  title,
  description,
  titleSize = "lg",
  actions,
  children,
}: SectionShellProps) {
  const titleClass =
    titleSize === "sm"
      ? "text-lg font-semibold text-gray-900"
      : titleSize === "md"
      ? "text-xl font-bold text-gray-900"
      : "text-2xl sm:text-3xl font-bold text-gray-900";

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className={titleClass}>{title}</h1>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
