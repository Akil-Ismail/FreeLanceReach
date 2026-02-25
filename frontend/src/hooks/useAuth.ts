"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type UserRole = "freelancer" | "company" | null;

export const useAuth = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      router.push("/login");
    } else if (role === "freelancer" || role === "company") {
      setUserRole(role as UserRole);
    }
    setIsLoading(false);
  }, [router]);

  const logout = () => {
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  return { userRole, isLoading, logout };
};
