"use client";

import { useEffect, useCallback, useState } from "react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import SearchBar from "@/components/protected/SearchBar";
import { Building2, Globe, Users, Phone, Mail, X, ExternalLink, Briefcase, ChevronDown, ChevronUp } from "lucide-react";

type Proposal = {
  id: number;
  title: string;
  description?: string;
  required_skills?: string[];
  budget_min?: number;
  budget_max?: number;
  timeline?: string;
  status: string;
  company_user_id: number;
};

type Company = {
  id: number;
  company_name?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  industry?: string;
  company_description?: string;
  company_size?: string;
  company_website?: string;
  phone_number?: string;
  email?: string;
  profile_picture_path?: string | null;
  cover_photo_path?: string | null;
};

function CompanyProfileModal({ company, userId, onClose }: { company: Company; userId: number; onClose: () => void }) {
  const [offers, setOffers] = useState<Proposal[] | null>(null);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offersOpen, setOffersOpen] = useState(false);
  const [expandedOfferId, setExpandedOfferId] = useState<number | null>(null);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [appliedMatchIds, setAppliedMatchIds] = useState<Record<number, number>>({});
  const [removingOfferId, setRemovingOfferId] = useState<number | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const toggleOffers = async () => {
    if (!offersOpen && offers === null) {
      setLoadingOffers(true);
      try {
        const res = await api.get("/proposals", { params: { actor_user_id: userId } });
        const all: Proposal[] = res.data || [];
        setOffers(all.filter((p) => p.company_user_id === company.id && p.status !== "closed"));
      } finally {
        setLoadingOffers(false);
      }
    }
    setOffersOpen((prev) => !prev);
  };

  const applyToOffer = async (offerId: number) => {
    setApplyingId(offerId);
    setApplyError(null);
    try {
      const res = await api.post(`/proposals/${offerId}/apply`, { actor_user_id: userId });
      const matchId = res.data?.match?.id;
      setAppliedIds((prev) => new Set(prev).add(offerId));
      if (matchId) setAppliedMatchIds((prev) => ({ ...prev, [offerId]: matchId }));
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setApplyError(e.response?.data?.message || e.message || "Application failed.");
    } finally {
      setApplyingId(null);
    }
  };

  const removeOffer = async (offerId: number) => {
    const matchId = appliedMatchIds[offerId];
    if (!matchId) return;
    setRemovingOfferId(offerId);
    try {
      await api.post(`/matches/${matchId}/respond`, { actor_user_id: userId, approve: false });
      setAppliedIds((prev) => { const n = new Set(prev); n.delete(offerId); return n; });
      setAppliedMatchIds((prev) => { const n = { ...prev }; delete n[offerId]; return n; });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setApplyError(e.response?.data?.message || e.message || "Could not remove application.");
    } finally {
      setRemovingOfferId(null);
    }
  };
  const name =
    company.company_name?.trim() ||
    [company.contact_first_name, company.contact_last_name].filter(Boolean).join(" ") ||
    "Unknown Company";
  const initials = name.slice(0, 2).toUpperCase();

  const handleKey = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }, [onClose]);
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* ── Cover photo ── */}
        <div className="relative h-40 shrink-0">
          {company.cover_photo_path ? (
            <img
              src={`http://localhost:8000/api/users/${company.id}/cover-photo`}
              alt="cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500 via-red-600 to-rose-700" />
          )}
          {/* Gradient fade at bottom so profile pic blends in */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/60 to-transparent" />

          {/* Close button overlaid on cover */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Profile picture + header (outside scroll so -mt-10 never gets clipped) ── */}
        <div className="relative z-10 -mt-10 px-6 flex items-end justify-between shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl shrink-0">
            {company.profile_picture_path ? (
              <img
                src={`http://localhost:8000/api/users/${company.id}/profile-picture`}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <span className="text-white font-bold text-2xl select-none">{initials}</span>
              </div>
            )}
          </div>
          {company.industry && (
            <span className="mb-1 text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100">
              {company.industry}
            </span>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 pt-3">

          {/* Name */}
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{name}</h2>
          {company.company_size && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Users className="w-3 h-3" /> {company.company_size} employees
            </p>
          )}

          {/* Description */}
          {company.company_description && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{company.company_description}</p>
          )}

          {/* Contact details */}
          {(company.contact_first_name || company.contact_last_name || company.email || company.phone_number) && (
            <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 divide-y divide-gray-100">
              {(company.contact_first_name || company.contact_last_name) && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Contact person</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {[company.contact_first_name, company.contact_last_name].filter(Boolean).join(" ")}
                    </p>
                  </div>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{company.email}</p>
                  </div>
                </div>
              )}
              {company.phone_number && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="text-sm font-semibold text-gray-800">{company.phone_number}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Job Offers */}
          <button
            onClick={toggleOffers}
            className="mt-4 flex items-center justify-between w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700"
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-red-500" />
              View Job Offers
            </span>
            {offersOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {offersOpen && (
            <div className="mt-2 rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {loadingOffers ? (
                <p className="text-xs text-gray-400 text-center py-6">Loading offers…</p>
              ) : !offers || offers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No open job offers from this company.</p>
              ) : (
                offers.map((offer) => {
                  const isExpanded = expandedOfferId === offer.id;
                  const isApplied = appliedIds.has(offer.id);
                  return (
                    <div key={offer.id} className="bg-white">
                      {/* Accordion header */}
                      <button
                        onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-gray-900 truncate">{offer.title}</span>
                          {isApplied && (
                            <span className="shrink-0 text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">Applied</span>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                      </button>

                      {/* Expanded body */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3">
                          {offer.description && (
                            <p className="text-xs text-gray-500 leading-relaxed">{offer.description}</p>
                          )}
                          {offer.required_skills && offer.required_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {offer.required_skills.map((s) => (
                                <span key={s} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">{s}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-4 text-xs text-gray-400">
                            {(offer.budget_min != null || offer.budget_max != null) && (
                              <span>
                                Budget:{" "}
                                {offer.budget_min != null ? `$${offer.budget_min}` : ""}
                                {offer.budget_min != null && offer.budget_max != null ? " – " : ""}
                                {offer.budget_max != null ? `$${offer.budget_max}` : ""}
                              </span>
                            )}
                            {offer.timeline && <span>Timeline: {offer.timeline}</span>}
                          </div>
                          {applyError && expandedOfferId === offer.id && (
                            <p className="text-xs text-red-500">{applyError}</p>
                          )}
                          {isApplied ? (
                            <button
                              disabled={removingOfferId === offer.id}
                              onClick={() => removeOffer(offer.id)}
                              className="w-full py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                            >
                              {removingOfferId === offer.id ? "Removing…" : "Remove Application"}
                            </button>
                          ) : (
                            <button
                              disabled={applyingId === offer.id}
                              onClick={() => applyToOffer(offer.id)}
                              className="w-full py-2 rounded-xl text-sm font-semibold transition bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {applyingId === offer.id ? "Applying…" : "Apply"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Website CTA */}
          {company.company_website && (
            <a
              href={company.company_website.startsWith("http") ? company.company_website : `https://${company.company_website}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition shadow-sm shadow-red-200"
            >
              <Globe className="w-4 h-4" /> Visit Website <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomeFreelancerPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Company | null>(null);
  const [userId, setUserId] = useState(0);

  useEffect(() => {
    const load = async () => {
      const id = Number(localStorage.getItem("userId") || 0);
      setUserId(id);
      try {
        const res = await api.get("/users/role/company", { params: { actor_user_id: id } });
        setCompanies(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isComplete = (c: Company) =>
    !!c.company_name?.trim() &&
    !!(c.industry || c.company_description || c.company_size);

  const filtered = companies.filter(isComplete).filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (c.company_name || "").toLowerCase().includes(q) ||
      (c.industry || "").toLowerCase().includes(q) ||
      (c.company_description || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <SectionShell title="Companies" description="Browse companies hiring freelancers on the platform.">
        <SearchBar value={query} onChange={setQuery} placeholder="Search by name, industry, or description…" />

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-gray-500 text-sm">Loading companies...</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((c) => {
              const name =
                c.company_name?.trim() ||
                [c.contact_first_name, c.contact_last_name].filter(Boolean).join(" ") ||
                "Unknown Company";
              const initials = name.slice(0, 2).toUpperCase();

              return (
                <div
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-red-200 hover:shadow-md transition-all flex flex-col gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 ring-1 ring-gray-100">
                      {c.profile_picture_path ? (
                        <img
                          src={`http://localhost:8000/api/users/${c.id}/profile-picture`}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{initials}</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">{name}</p>
                      {c.industry && <p className="text-xs text-gray-400 truncate">{c.industry}</p>}
                    </div>
                  </div>

                  {c.company_description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{c.company_description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-auto">
                    {c.company_size && (
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        <Users className="w-3 h-3" /> {c.company_size}
                      </span>
                    )}
                    {c.company_website && (
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        <Globe className="w-3 h-3" /> Website
                      </span>
                    )}
                    {c.phone_number && (
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                        <Phone className="w-3 h-3" /> {c.phone_number}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{query ? `No companies match "${query}".` : "No companies yet."}</p>
              </div>
            )}
          </div>
        )}
      </SectionShell>

      {selected && <CompanyProfileModal company={selected} userId={userId} onClose={() => setSelected(null)} />}
    </>
  );
}
