"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import {
  X, Briefcase, Globe, Clock, DollarSign, Phone, Mail,
  FileText, ExternalLink, Building2,
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

export default function FreelancerProfileModal({ freelancerId, onClose }: Props) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const fp = user?.freelancer_profile;
  const isFreelancer = user?.role === "freelancer";

  const displayName = isFreelancer
    ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || `Freelancer #${user?.id}`
    : user?.company_name || `Company #${user?.id}`;

  const initials = isFreelancer
    ? `${(user?.first_name || "?")[0]}${(user?.last_name || "?")[0]}`.toUpperCase()
    : `${(user?.company_name || "?")[0]}`.toUpperCase();

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
              <div
                className="relative h-32 sm:h-40 overflow-hidden"
                style={user.cover_photo_path
                  ? { backgroundImage: `url(http://localhost:8000/api/users/${user.id}/cover-photo)`, backgroundSize: "cover", backgroundPosition: "center" }
                  : undefined}
              >
                {!user.cover_photo_path && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />
                )}
              </div>

              <div className="px-6 pb-3">
                {/* Profile picture + CV button row */}
                <div className="-mt-10 mb-3 flex items-end justify-between">
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
