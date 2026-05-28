"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import {
  X, Briefcase, Globe, Clock, DollarSign, Phone, Mail,
  FileText, ExternalLink, Building2, Send,
} from "lucide-react";

type UserData = {
  id?: number;
  role?: string;
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  freelance_category?: string;
  professional_bio?: string;
  cv_path?: string | null;
  profile_picture_path?: string | null;
  cover_photo_path?: string | null;
  company_name?: string;
  industry?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  company_description?: string;
  company_website?: string;
  company_size?: string;
  freelancer_profile?: {
    headline?: string;
    skills?: string[];
    hourly_rate?: string | number;
    experience_level?: string;
    bio?: string;
    portfolio_url?: string;
    availability?: string;
  };
};

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-gray-100">
        {icon && <span className="text-red-600">{icon}</span>}
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium ${value ? "text-gray-800" : "text-gray-300 italic"}`}>
          {value || "Not specified"}
        </p>
      </div>
    </div>
  );
}

interface Props {
  freelancerId: number;
  onClose: () => void;
}

type OfferForm = {
  title: string;
  description: string;
  required_skills: string;
  budget_min: string;
  budget_max: string;
  timeline: string;
};

const EMPTY_OFFER: OfferForm = {
  title: "", description: "", required_skills: "",
  budget_min: "", budget_max: "", timeline: "",
};

export default function FreelancerProfileModal({ freelancerId, onClose }: Props) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState<OfferForm>(EMPTY_OFFER);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState(false);

  const viewerRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const viewerUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${freelancerId}`);
      setUser(res.data || null);
    } finally {
      setLoading(false);
    }
  }, [freelancerId]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewerUserId) return;
    setOfferSubmitting(true);
    setOfferError(null);
    try {
      await api.post("/proposals", {
        actor_user_id: Number(viewerUserId),
        company_user_id: Number(viewerUserId),
        title: offerForm.title,
        description: offerForm.description,
        required_skills: offerForm.required_skills
          ? offerForm.required_skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        budget_min: offerForm.budget_min ? Number(offerForm.budget_min) : undefined,
        budget_max: offerForm.budget_max ? Number(offerForm.budget_max) : undefined,
        timeline: offerForm.timeline || undefined,
        status: "open",
      });
      setOfferSuccess(true);
      setOfferForm(EMPTY_OFFER);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setOfferError(msg || "Failed to send offer. Please try again.");
    } finally {
      setOfferSubmitting(false);
    }
  };

  const fp = user?.freelancer_profile;
  const isFreelancer = user?.role === "freelancer";

  const displayName = isFreelancer
    ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || `Freelancer #${user?.id}`
    : user?.company_name || `Company #${user?.id}`;

  const initials = isFreelancer
    ? `${(user?.first_name || "?")[0]}${(user?.last_name || "?")[0]}`.toUpperCase()
    : `${(user?.company_name || "?")[0]}`.toUpperCase();

  const offerRef = useRef<HTMLDivElement>(null);

  const scrollToOffer = () => {
    setShowOfferForm(true);
    setOfferSuccess(false);
    setOfferError(null);
    setTimeout(() => offerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-4 sm:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-gray-50 rounded-2xl shadow-2xl my-auto">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
            Profile not found.
          </div>
        ) : (
          <div className="space-y-4 pb-6">

            {/* ── Header card ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Cover photo */}
              <div className="relative h-32 sm:h-40">
                {user.cover_photo_path ? (
                  <img
                    src={`http://localhost:8000/api/users/${user.id}/cover-photo`}
                    alt="cover"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
                )}
              </div>

              <div className="px-6 pb-3">
                {/* Profile picture + CV button row */}
                <div className="-mt-10 mb-3 flex items-end justify-between relative z-10">
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden shrink-0">
                    {user.profile_picture_path ? (
                      <img
                        src={`http://localhost:8000/api/users/${user.id}/profile-picture`}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-red-600 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl select-none">{initials}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {user.cv_path && (
                      <a
                        href={`http://localhost:8000/api/users/${user.id}/cv`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn text-xs px-3 py-1.5 flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> View CV
                      </a>
                    )}
                    {viewerRole === "company" && isFreelancer && (
                      <button
                        onClick={scrollToOffer}
                        className="btn text-xs px-3 py-1.5 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white border-0"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Offer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name / headline / badges */}
              <div className="px-6 pb-5">
                <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                {fp?.headline && (
                  <p className="text-gray-600 mt-0.5 text-sm">{fp.headline}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {user.freelance_category && (
                    <span className="bg-red-50 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full border border-red-100">
                      {user.freelance_category}
                    </span>
                  )}
                  {user.industry && (
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100">
                      {user.industry}
                    </span>
                  )}
                  {fp?.hourly_rate && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-100">
                      ${fp.hourly_rate}/hr
                    </span>
                  )}
                  {fp?.availability && (
                    <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-100">
                      {fp.availability}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── About ── */}
            {(user.professional_bio || fp?.bio || user.company_description) && (
              <Section title="About">
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {isFreelancer
                    ? user.professional_bio || fp?.bio
                    : user.company_description}
                </p>
              </Section>
            )}

            {/* ── Skills ── */}
            {isFreelancer && (fp?.skills || []).length > 0 && (
              <Section title="Skills">
                <div className="flex flex-wrap gap-2">
                  {(fp?.skills || []).map((skill) => (
                    <span key={skill} className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Professional Details ── */}
            {isFreelancer && (
              <Section title="Professional Details" icon={<Briefcase className="w-4 h-4" />}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Experience Level" value={fp?.experience_level} />
                  <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Hourly Rate" value={fp?.hourly_rate ? `$${fp.hourly_rate}/hr` : undefined} />
                  <DetailRow icon={<Clock className="w-4 h-4" />} label="Availability" value={fp?.availability} />
                  {fp?.portfolio_url ? (
                    <div className="flex items-start gap-2">
                      <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Portfolio</p>
                        <a href={fp.portfolio_url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          View Portfolio <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <DetailRow icon={<Globe className="w-4 h-4" />} label="Portfolio" value={undefined} />
                  )}
                </div>
              </Section>
            )}

            {/* ── Company Details ── */}
            {!isFreelancer && (
              <Section title="Company Details" icon={<Building2 className="w-4 h-4" />}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <DetailRow label="Contact Person"
                    value={`${user.contact_first_name || ""} ${user.contact_last_name || ""}`.trim() || undefined} />
                  <DetailRow label="Company Size" value={user.company_size} />
                  {user.company_website && (
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Website</p>
                        <a href={user.company_website} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                          {user.company_website} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ── Send Offer Form ── */}
            {showOfferForm && viewerRole === "company" && (
              <div ref={offerRef}>
              <Section title="Send Offer" icon={<Send className="w-4 h-4" />}>
                {offerSuccess ? (
                  <div className="text-center py-4">
                    <p className="text-green-600 font-semibold">Offer sent successfully!</p>
                    <p className="text-gray-500 text-sm mt-1">AI matching will run automatically to rank candidates.</p>
                    <button
                      onClick={() => { setOfferSuccess(false); setShowOfferForm(false); }}
                      className="mt-4 btn text-xs px-4 py-1.5"
                    >Close</button>
                  </div>
                ) : (
                  <form onSubmit={handleSendOffer} className="space-y-4">
                    {offerError && (
                      <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{offerError}</p>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Job Title <span className="text-red-500">*</span></label>
                      <input
                        required
                        value={offerForm.title}
                        onChange={(e) => setOfferForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Frontend Developer for E-commerce App"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                      <textarea
                        required
                        rows={4}
                        value={offerForm.description}
                        onChange={(e) => setOfferForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Describe the project, responsibilities, and expectations..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Required Skills</label>
                      <input
                        value={offerForm.required_skills}
                        onChange={(e) => setOfferForm((f) => ({ ...f, required_skills: e.target.value }))}
                        placeholder="React, TypeScript, Node.js (comma-separated)"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Budget Min ($)</label>
                        <input
                          type="number" min="0"
                          value={offerForm.budget_min}
                          onChange={(e) => setOfferForm((f) => ({ ...f, budget_min: e.target.value }))}
                          placeholder="500"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Budget Max ($)</label>
                        <input
                          type="number" min="0"
                          value={offerForm.budget_max}
                          onChange={(e) => setOfferForm((f) => ({ ...f, budget_max: e.target.value }))}
                          placeholder="2000"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Timeline</label>
                      <input
                        value={offerForm.timeline}
                        onChange={(e) => setOfferForm((f) => ({ ...f, timeline: e.target.value }))}
                        placeholder="e.g. 2 weeks, 1 month"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setShowOfferForm(false)} className="btn-secondary text-xs px-4 py-1.5">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={offerSubmitting}
                        className="btn text-xs px-4 py-1.5 flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white border-0 disabled:opacity-60"
                      >
                        {offerSubmitting ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        {offerSubmitting ? "Sending…" : "Send Offer"}
                      </button>
                    </div>
                  </form>
                )}
              </Section>
              </div>
            )}

            {/* ── Contact ── */}
            <Section title="Contact Information" icon={<Mail className="w-4 h-4" />}>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-800">{user.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-800">{user.phone_number || "—"}</p>
                  </div>
                </div>
              </div>
            </Section>

          </div>
        )}
      </div>
    </div>
  );
}
