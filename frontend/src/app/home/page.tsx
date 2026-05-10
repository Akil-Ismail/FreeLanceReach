"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const setupDone = userId
      ? localStorage.getItem(`profileSetupComplete:${userId}`) === "true"
      : false;

    if (!setupDone) {
      router.replace("/home/setup");
      return;
    }

    if (role === "company") {
      router.replace("/home/employer");
      return;
    }

    router.replace("/home/freelancer");
  }, [router]);

  return null;
}
