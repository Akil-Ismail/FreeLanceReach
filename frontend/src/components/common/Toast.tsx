"use client";

import { useEffect } from "react";
import { CheckCircle, AlertCircle, InfoIcon } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      text: "text-green-800",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      text: "text-red-800",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: <InfoIcon className="w-5 h-5 text-blue-600" />,
      text: "text-blue-800",
    },
  }[type];

  return (
    <div
      className={`fixed bottom-4 right-4 ${config.bg} ${config.text} px-6 py-4 rounded-lg border ${config.border} shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300`}
    >
      {config.icon}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
