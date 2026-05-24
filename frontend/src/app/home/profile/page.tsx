"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import CropModal from "@/components/protected/CropModal";
import {
  Pencil, Check, X, Plus, Paperclip, CheckCircle2, ExternalLink,
  Briefcase, Globe, Clock, DollarSign, Phone, Mail, Tag, Building2, Camera,
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
};

type ProfileData = {
  headline?: string;
  skills?: string[];
  hourly_rate?: string;
  experience_level?: string;
  bio?: string;
  portfolio_url?: string;
  availability?: string;
};

type Draft = Record<string, unknown>;

function SectionCard({
  title,
  icon,
  editing,
  onEdit,
  onSave,
  onCancel,
  saving,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {icon && <span className="text-red-600">{icon}</span>}
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="btn text-xs px-3 py-1.5 flex items-center gap-1"
            >
              {saving ? (
                <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
}) {
  if (!value) {
    return (
      <div className="flex items-start gap-2">
        {icon && <span className="mt-0.5 shrink-0 text-gray-300">{icon}</span>}
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-sm text-gray-300 italic">Not set</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

export default function HomeProfilePage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<"freelancer" | "company" | null>(null);

  const [user, setUser] = useState<UserData>({});
  const [profile, setProfile] = useState<ProfileData>({});

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [hasCv, setHasCv] = useState(false);
  const [cvName, setCvName] = useState("");
  const [cvUploading, setCvUploading] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [pictureUploading, setPictureUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const pictureInputRef = useRef<HTMLInputElement>(null);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [newSkill, setNewSkill] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async (id: number) => {
    const res = await api.get(`/users/${id}`);
    const data = res.data || {};
    setUser(data);
    if (data.freelancer_profile) {
      const fp = data.freelancer_profile;
      setProfile({
        headline: fp.headline || "",
        skills: fp.skills || [],
        hourly_rate: fp.hourly_rate ? String(fp.hourly_rate) : "",
        experience_level: fp.experience_level || "",
        bio: fp.bio || "",
        portfolio_url: fp.portfolio_url || "",
        availability: fp.availability || "",
      });
    }
    if (data.cv_path) {
      setHasCv(true);
      setCvName(data.cv_path.split("/").pop() || "cv");
    }
    if (data.profile_picture_path) {
      setPictureUrl(`http://localhost:8000/api/users/${id}/profile-picture?t=${Date.now()}`);
    }
    if (data.cover_photo_path) {
      setCoverUrl(`http://localhost:8000/api/users/${id}/cover-photo?t=${Date.now()}`);
    }
  }, []);

  useEffect(() => {
    const id = Number(localStorage.getItem("userId") || 0);
    const userRole = localStorage.getItem("userRole") as "freelancer" | "company" | null;
    if (!id || !userRole) return;
    setUserId(id);
    setRole(userRole);
    load(id);
  }, [load]);

  const startEdit = (section: string, initial: Draft) => {
    setEditingSection(section);
    setDraft(initial);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setDraft({});
    setNewSkill("");
  };

  const setDraftField = (key: string, value: unknown) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const saveUserFields = async (fields: string[]) => {
    if (!userId) return;
    const payload: Record<string, unknown> = {};
    fields.forEach((f) => { payload[f] = draft[f]; });
    const res = await api.put(`/users/${userId}`, payload);
    setUser((prev) => ({ ...prev, ...(res.data?.user || payload) }));
  };

  const saveProfileFields = async (fields: string[]) => {
    if (!userId) return;
    const payload: Record<string, unknown> = { actor_user_id: userId, user_id: userId };
    fields.forEach((f) => { payload[f] = draft[f]; });
    await api.post("/freelancer-profile", payload);
    setProfile((prev) => {
      const next = { ...prev };
      fields.forEach((f) => { (next as Record<string, unknown>)[f] = draft[f]; });
      return next;
    });
  };

  const save = async (userFields: string[], profileFields: string[] = []) => {
    if (!userId) return;
    setSaving(true);
    try {
      await Promise.all([
        userFields.length ? saveUserFields(userFields) : Promise.resolve(),
        profileFields.length ? saveProfileFields(profileFields) : Promise.resolve(),
      ]);
      showToast("success", "Saved successfully.");
      cancelEdit();
    } catch {
      showToast("error", "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const uploadCv = async (file: File) => {
    if (!userId) return;
    setCvUploading(true);
    try {
      const fd = new FormData();
      fd.append("cv", file);
      await api.post(`/users/${userId}/cv`, fd);
      setHasCv(true);
      setCvName(file.name);
      showToast("success", "CV uploaded.");
    } catch {
      showToast("error", "CV upload failed.");
    } finally {
      setCvUploading(false);
    }
  };

  const uploadPicture = async (file: File) => {
    if (!userId) return;
    setPictureUploading(true);
    try {
      const fd = new FormData();
      fd.append("picture", file);
      // Explicitly clear Content-Type so axios sets multipart/form-data with boundary
      await api.post(`/users/${userId}/profile-picture`, fd, {
        headers: { "Content-Type": undefined },
      });
      setPictureUrl(`http://localhost:8000/api/users/${userId}/profile-picture?t=${Date.now()}`);
      showToast("success", "Profile picture updated.");
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      const detail = e.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(" ")
        : e.response?.data?.message || e.message || "";
      showToast("error", detail ? `Upload failed: ${detail}` : "Picture upload failed.");
    } finally {
      setPictureUploading(false);
    }
  };

  const uploadCover = async (file: File) => {
    if (!userId) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("cover", file);
      await api.post(`/users/${userId}/cover-photo`, fd, {
        headers: { "Content-Type": undefined },
      });
      setCoverUrl(`http://localhost:8000/api/users/${userId}/cover-photo?t=${Date.now()}`);
      showToast("success", "Cover photo updated.");
    } catch (err) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string };
      const detail = e.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(" ")
        : e.response?.data?.message || e.message || "";
      showToast("error", detail ? `Upload failed: ${detail}` : "Cover photo upload failed.");
    } finally {
      setCoverUploading(false);
    }
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const current = (draft.skills as string[]) || [];
    if (!current.includes(trimmed)) {
      setDraftField("skills", [...current, trimmed]);
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    const current = (draft.skills as string[]) || [];
    setDraftField("skills", current.filter((s) => s !== skill));
  };

  const initials =
    role === "freelancer"
      ? `${(user.first_name || "?")[0]}${(user.last_name || "?")[0]}`.toUpperCase()
      : `${(user.company_name || "?")[0]}`.toUpperCase();

  const displayName =
    role === "freelancer"
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Your Name"
      : user.company_name || "Your Company";

  return (
    <SectionShell title="Profile" titleSize="sm">
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={(file) => {
            setCropSrc(null);
            uploadPicture(file);
          }}
          onCancel={() => {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }}
        />
      )}

      {toast && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* ── Header card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

        {/* ① Cover photo — full-width banner, click to upload */}
        <div
          className="relative h-36 sm:h-44 overflow-hidden cursor-pointer group"
          onClick={() => !coverUploading && coverInputRef.current?.click()}
          style={coverUrl
            ? { backgroundImage: `url(${coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined}
        >
          {!coverUrl && <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700" />}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center transition-all">
            <div className="flex flex-col items-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {coverUploading
                ? <span className="w-6 h-6 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                : <>
                    <Camera className="w-6 h-6 drop-shadow" />
                    <span className="text-xs font-semibold drop-shadow">
                      {coverUrl ? "Change cover photo" : "Add cover photo"}
                    </span>
                  </>}
            </div>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadCover(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* ② Profile picture — circular, overlaps banner, click to upload */}
          <div className="-mt-10 mb-3 flex items-end justify-between">
            <button
              onClick={() => pictureInputRef.current?.click()}
              disabled={pictureUploading}
              title="Change profile picture"
              className="relative w-20 h-20 rounded-full border-4 border-white shadow-lg group overflow-hidden focus:outline-none shrink-0"
            >
              {pictureUrl ? (
                <img src={pictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-red-600 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl select-none">{initials}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {pictureUploading
                  ? <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  : <Camera className="w-4 h-4 text-white" />}
              </div>
            </button>
            <input
              ref={pictureInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = URL.createObjectURL(f);
                setCropSrc(url);
                e.target.value = "";
              }}
            />

            <button
              onClick={() =>
                startEdit("header", {
                  first_name: user.first_name || "",
                  last_name: user.last_name || "",
                  freelance_category: user.freelance_category || "",
                  headline: profile.headline || "",
                  hourly_rate: profile.hourly_rate || "",
                  availability: profile.availability || "",
                  company_name: user.company_name || "",
                  industry: user.industry || "",
                })
              }
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Name / headline / badges */}
        <div className="px-6 pb-5 -mt-3">
          {editingSection === "header" ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {role === "freelancer" ? (
                  <>
                    <div>
                      <FieldLabel>First Name</FieldLabel>
                      <input
                        className="input"
                        value={String(draft.first_name || "")}
                        onChange={(e) => setDraftField("first_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel>Last Name</FieldLabel>
                      <input
                        className="input"
                        value={String(draft.last_name || "")}
                        onChange={(e) => setDraftField("last_name", e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Headline</FieldLabel>
                      <input
                        className="input"
                        placeholder="e.g. Full-Stack Developer | React & Node.js"
                        value={String(draft.headline || "")}
                        onChange={(e) => setDraftField("headline", e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel>Freelance Category</FieldLabel>
                      <input
                        className="input"
                        placeholder="e.g. Web Development"
                        value={String(draft.freelance_category || "")}
                        onChange={(e) => setDraftField("freelance_category", e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel>Hourly Rate ($/hr)</FieldLabel>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        value={String(draft.hourly_rate || "")}
                        onChange={(e) => setDraftField("hourly_rate", e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel>Availability</FieldLabel>
                      <select
                        className="input"
                        value={String(draft.availability || "")}
                        onChange={(e) => setDraftField("availability", e.target.value)}
                      >
                        <option value="">Select...</option>
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Weekends only</option>
                        <option>Not available</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="sm:col-span-2">
                      <FieldLabel>Company Name</FieldLabel>
                      <input
                        className="input"
                        value={String(draft.company_name || "")}
                        onChange={(e) => setDraftField("company_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <FieldLabel>Industry</FieldLabel>
                      <input
                        className="input"
                        placeholder="e.g. Technology, Healthcare"
                        value={String(draft.industry || "")}
                        onChange={(e) => setDraftField("industry", e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={cancelEdit} className="btn-secondary text-sm px-4 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  onClick={() =>
                    role === "freelancer"
                      ? save(["first_name", "last_name", "freelance_category"], ["headline", "hourly_rate", "availability"])
                      : save(["company_name", "industry"])
                  }
                  disabled={saving}
                  className="btn text-sm px-4 flex items-center gap-1.5"
                >
                  {saving
                    ? <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    : <Check className="w-3.5 h-3.5" />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              {profile.headline && (
                <p className="text-gray-600 mt-0.5 text-sm">{profile.headline}</p>
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
                {profile.hourly_rate && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-100">
                    ${profile.hourly_rate}/hr
                  </span>
                )}
                {profile.availability && (
                  <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-100">
                    {profile.availability}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── About ── */}
      <SectionCard
        title="About"
        editing={editingSection === "about"}
        onEdit={() =>
          startEdit("about", {
            professional_bio: user.professional_bio || profile.bio || "",
            company_description: user.company_description || "",
          })
        }
        onSave={() =>
          role === "freelancer"
            ? save(["professional_bio"])
            : save(["company_description"])
        }
        onCancel={cancelEdit}
        saving={saving}
      >
        {editingSection === "about" ? (
          <textarea
            className="input min-h-32 resize-none"
            placeholder={
              role === "freelancer"
                ? "Write a short bio about yourself..."
                : "Describe your company..."
            }
            value={String(
              draft[
                role === "freelancer" ? "professional_bio" : "company_description"
              ] || ""
            )}
            onChange={(e) =>
              setDraftField(
                role === "freelancer" ? "professional_bio" : "company_description",
                e.target.value
              )
            }
          />
        ) : (
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
            {role === "freelancer"
              ? user.professional_bio ||
                profile.bio || (
                  <span className="text-gray-400 italic">
                    No bio yet. Add one to help companies find you.
                  </span>
                )
              : user.company_description || (
                  <span className="text-gray-400 italic">No description yet.</span>
                )}
          </p>
        )}
      </SectionCard>

      {/* ── Skills (freelancer only) ── */}
      {role === "freelancer" && (
        <SectionCard
          title="Skills"
          icon={<Tag className="w-4 h-4" />}
          editing={editingSection === "skills"}
          onEdit={() =>
            startEdit("skills", { skills: [...(profile.skills || [])] })
          }
          onSave={() => save([], ["skills"])}
          onCancel={cancelEdit}
          saving={saving}
        >
          {editingSection === "skills" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 min-h-8">
                {((draft.skills as string[]) || []).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="hover:text-red-900 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {((draft.skills as string[]) || []).length === 0 && (
                  <span className="text-xs text-gray-400 italic">No skills added yet.</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="input text-sm"
                  placeholder="Add a skill (e.g. React, Python, Figma)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <button
                  onClick={addSkill}
                  className="btn text-sm px-3 flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile.skills || []).length === 0 ? (
                <span className="text-sm text-gray-400 italic">
                  No skills added. Click edit to add your skills.
                </span>
              ) : (
                (profile.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {skill}
                  </span>
                ))
              )}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Professional Details (freelancer only) ── */}
      {role === "freelancer" && (
        <SectionCard
          title="Professional Details"
          icon={<Briefcase className="w-4 h-4" />}
          editing={editingSection === "details"}
          onEdit={() =>
            startEdit("details", {
              experience_level: profile.experience_level || "",
              hourly_rate: profile.hourly_rate || "",
              availability: profile.availability || "",
              portfolio_url: profile.portfolio_url || "",
            })
          }
          onSave={() =>
            save([], ["experience_level", "hourly_rate", "availability", "portfolio_url"])
          }
          onCancel={cancelEdit}
          saving={saving}
        >
          {editingSection === "details" ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Experience Level</FieldLabel>
                <select
                  className="input"
                  value={String(draft.experience_level || "")}
                  onChange={(e) => setDraftField("experience_level", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option>Entry-level</option>
                  <option>Mid-level</option>
                  <option>Senior</option>
                  <option>Expert</option>
                </select>
              </div>
              <div>
                <FieldLabel>Hourly Rate ($/hr)</FieldLabel>
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="e.g. 50"
                  value={String(draft.hourly_rate || "")}
                  onChange={(e) => setDraftField("hourly_rate", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Availability</FieldLabel>
                <select
                  className="input"
                  value={String(draft.availability || "")}
                  onChange={(e) => setDraftField("availability", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Weekends only</option>
                  <option>Not available</option>
                </select>
              </div>
              <div>
                <FieldLabel>Portfolio URL</FieldLabel>
                <input
                  className="input"
                  type="url"
                  placeholder="https://yourportfolio.com"
                  value={String(draft.portfolio_url || "")}
                  onChange={(e) => setDraftField("portfolio_url", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              <DetailRow
                icon={<Briefcase className="w-4 h-4" />}
                label="Experience Level"
                value={profile.experience_level}
              />
              <DetailRow
                icon={<DollarSign className="w-4 h-4" />}
                label="Hourly Rate"
                value={profile.hourly_rate ? `$${profile.hourly_rate}/hr` : undefined}
              />
              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="Availability"
                value={profile.availability}
              />
              {profile.portfolio_url ? (
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Portfolio</p>
                    <a
                      href={profile.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View Portfolio <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <DetailRow
                  icon={<Globe className="w-4 h-4" />}
                  label="Portfolio"
                  value={undefined}
                />
              )}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Company Details (company only) ── */}
      {role === "company" && (
        <SectionCard
          title="Company Details"
          icon={<Building2 className="w-4 h-4" />}
          editing={editingSection === "company-details"}
          onEdit={() =>
            startEdit("company-details", {
              contact_first_name: user.contact_first_name || "",
              contact_last_name: user.contact_last_name || "",
              company_website: user.company_website || "",
              company_size: user.company_size || "",
            })
          }
          onSave={() =>
            save([
              "contact_first_name",
              "contact_last_name",
              "company_website",
              "company_size",
            ])
          }
          onCancel={cancelEdit}
          saving={saving}
        >
          {editingSection === "company-details" ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Contact First Name</FieldLabel>
                <input
                  className="input"
                  value={String(draft.contact_first_name || "")}
                  onChange={(e) => setDraftField("contact_first_name", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Contact Last Name</FieldLabel>
                <input
                  className="input"
                  value={String(draft.contact_last_name || "")}
                  onChange={(e) => setDraftField("contact_last_name", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Company Website</FieldLabel>
                <input
                  className="input"
                  type="url"
                  placeholder="https://yourcompany.com"
                  value={String(draft.company_website || "")}
                  onChange={(e) => setDraftField("company_website", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Company Size</FieldLabel>
                <select
                  className="input"
                  value={String(draft.company_size || "")}
                  onChange={(e) => setDraftField("company_size", e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="1-10">1–10 employees</option>
                  <option value="11-50">11–50 employees</option>
                  <option value="51-200">51–200 employees</option>
                  <option value="201-500">201–500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              <DetailRow
                label="Contact Person"
                value={
                  `${user.contact_first_name || ""} ${user.contact_last_name || ""}`.trim() ||
                  undefined
                }
              />
              <DetailRow label="Company Size" value={user.company_size} />
              {user.company_website ? (
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    <a
                      href={user.company_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {user.company_website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <DetailRow
                  icon={<Globe className="w-4 h-4" />}
                  label="Website"
                  value={undefined}
                />
              )}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Contact Info ── */}
      <SectionCard
        title="Contact Information"
        icon={<Mail className="w-4 h-4" />}
        editing={editingSection === "contact"}
        onEdit={() =>
          startEdit("contact", {
            email: user.email || "",
            phone_number: user.phone_number || "",
          })
        }
        onSave={() => save(["email", "phone_number"])}
        onCancel={cancelEdit}
        saving={saving}
      >
        {editingSection === "contact" ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Email Address</FieldLabel>
              <input
                className="input"
                type="email"
                value={String(draft.email || "")}
                onChange={(e) => setDraftField("email", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Phone Number</FieldLabel>
              <input
                className="input"
                type="tel"
                placeholder="+1 555 000 0000"
                value={String(draft.phone_number || "")}
                onChange={(e) => setDraftField("phone_number", e.target.value)}
              />
            </div>
          </div>
        ) : (
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
        )}
      </SectionCard>

      {/* ── CV / Resume (freelancer only) ── */}
      {role === "freelancer" && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-gray-100">
            <Paperclip className="w-4 h-4 text-red-600" />
            <h2 className="font-semibold text-gray-900">CV / Resume</h2>
          </div>
          <div className="px-6 py-5">
            {hasCv ? (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {cvName}
                </span>
                <a
                  href={`http://localhost:8000/api/users/${userId}/cv`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View CV
                </a>
                <button
                  onClick={() => cvInputRef.current?.click()}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                onClick={() => cvInputRef.current?.click()}
                disabled={cvUploading}
                className="flex items-center gap-2 text-sm text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                <Paperclip className="w-4 h-4" />
                {cvUploading ? "Uploading…" : "Upload CV (PDF / DOC / DOCX)"}
              </button>
            )}
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCv(f);
              }}
            />
          </div>
        </div>
      )}
    </SectionShell>
  );
}
