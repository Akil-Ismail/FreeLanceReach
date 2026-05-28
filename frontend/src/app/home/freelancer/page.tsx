"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import SearchBar from "@/components/protected/SearchBar";
import { getCachedValue, setCachedValue } from "@/lib/localCache";

type Proposal = {
  id: number;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  timeline: string | null;
  required_skills?: string[];
};

export default function HomeFreelancerPage() {
  const [offers, setOffers] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const userId = Number(localStorage.getItem("userId") || 0);
      const cacheKey = `freelancer:offers:${userId}`;
      const cached = getCachedValue<Proposal[]>(cacheKey, 1000 * 60 * 5);
      if (cached) { setOffers(cached); setLoading(false); return; }
      try {
        const response = await api.get("/proposals", { params: { actor_user_id: userId } });
        const next = response.data || [];
        setOffers(next);
        setCachedValue(cacheKey, next);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = offers.filter((o) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      o.title.toLowerCase().includes(q) ||
      o.description.toLowerCase().includes(q) ||
      (o.required_skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <SectionShell>
      <SearchBar value={query} onChange={setQuery} placeholder="Search by title, skill, or description…" />

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-600">
          Loading offers...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((offer) => (
            <div key={offer.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-3">{offer.description}</p>
              <div className="mt-3 text-sm text-gray-500">
                <p>Budget: {offer.budget_min ?? "-"} – {offer.budget_max ?? "-"}</p>
                <p>Timeline: {offer.timeline || "Not specified"}</p>
              </div>
              {offer.required_skills?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {offer.required_skills.slice(0, 5).map((skill) => (
                    <span key={skill} className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-6 text-gray-500 text-sm text-center">
              {query ? `No offers match "${query}".` : "No job offers yet."}
            </div>
          )}
        </div>
      )}
    </SectionShell>
  );
}
