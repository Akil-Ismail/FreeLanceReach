"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import { getCachedValue, setCachedValue } from "@/lib/localCache";

type Freelancer = {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  freelance_category?: string;
  professional_bio?: string;
};

export default function HomeEmployerPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userId = Number(localStorage.getItem("userId") || 0);
      const cacheKey = `employer:suggested_freelancers:${userId}`;
      const cached = getCachedValue<Freelancer[]>(cacheKey, 1000 * 60 * 5);

      if (cached) {
        setFreelancers(cached);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/users/role/freelancer");
        const next = response.data || [];
        setFreelancers(next);
        setCachedValue(cacheKey, next);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <SectionShell
      title="Employer Home"
      description="Review suggested freelancers with profile previews and shortlist top candidates."
    >
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-600">
          Loading suggested freelancers...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {freelancers.map((freelancer) => (
            <div
              key={freelancer.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              <div className="w-11 h-11 rounded-full bg-red-100 text-red-700 font-semibold flex items-center justify-center mb-3">
                {(freelancer.first_name?.[0] || "F").toUpperCase()}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {freelancer.first_name || "Freelancer"}{" "}
                {freelancer.last_name || ""}
              </h3>
              <p className="text-sm text-gray-500">{freelancer.email}</p>
              <p className="mt-2 text-sm text-red-700 font-medium">
                {freelancer.freelance_category || "Generalist"}
              </p>
              <p className="mt-2 text-sm text-gray-600 line-clamp-4">
                {freelancer.professional_bio ||
                  "Professional details will appear after profile setup."}
              </p>
            </div>
          ))}
          {freelancers.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-600">
              No suggested freelancers available yet.
            </div>
          )}
        </div>
      )}
    </SectionShell>
  );
}
