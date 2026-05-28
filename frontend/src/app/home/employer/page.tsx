"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import FreelancerProfileModal from "@/components/protected/FreelancerProfileModal";
import SearchBar from "@/components/protected/SearchBar";
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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const userId = Number(localStorage.getItem("userId") || 0);
      const cacheKey = `employer:suggested_freelancers:${userId}`;
      const cached = getCachedValue<Freelancer[]>(cacheKey, 1000 * 60 * 5);
      if (cached) { setFreelancers(cached); setLoading(false); return; }
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

  const filtered = freelancers.filter((f) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      `${f.first_name || ""} ${f.last_name || ""}`.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      (f.freelance_category || "").toLowerCase().includes(q) ||
      (f.professional_bio || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      {selectedId !== null && (
        <FreelancerProfileModal freelancerId={selectedId} onClose={() => setSelectedId(null)} />
      )}
      <SectionShell>
        <SearchBar value={query} onChange={setQuery} placeholder="Search by name, category, or bio…" />

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-600">
            Loading suggested freelancers...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((freelancer) => (
              <div
                key={freelancer.id}
                onClick={() => setSelectedId(freelancer.id)}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-red-200 transition"
              >
                <div className="w-11 h-11 rounded-full bg-red-100 text-red-700 font-semibold flex items-center justify-center mb-3">
                  {(freelancer.first_name?.[0] || "F").toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {freelancer.first_name || "Freelancer"} {freelancer.last_name || ""}
                </h3>
                <p className="text-sm text-gray-500">{freelancer.email}</p>
                <p className="mt-2 text-sm text-red-700 font-medium">
                  {freelancer.freelance_category || "Generalist"}
                </p>
                <p className="mt-2 text-sm text-gray-600 line-clamp-4">
                  {freelancer.professional_bio || "Professional details will appear after profile setup."}
                </p>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-6 text-gray-500 text-sm text-center">
                {query ? `No freelancers match "${query}".` : "No freelancers available yet."}
              </div>
            )}
          </div>
        )}
      </SectionShell>
    </>
  );
}
