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
    const userId = localStorage.getItem("userId");
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    if (userId) {
      localStorage.removeItem(`user:profile:${userId}`);
      localStorage.removeItem(`freelancer:offers:${userId}`);
      localStorage.removeItem(`employer:suggested_freelancers:${userId}`);
    }
    router.push("/login");
  };

  return { userRole, isLoading, logout };
};
