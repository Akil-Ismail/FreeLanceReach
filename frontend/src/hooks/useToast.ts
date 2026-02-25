"use client";

import { useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
    duration = 3000,
  ) => {
    setToast({ message, type, duration });
  };

  return { toast, setToast, showToast };
};
