"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import { getCachedValue, setCachedValue } from "@/lib/localCache";
import { Paperclip, CheckCircle2, ExternalLink } from "lucide-react";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  multiline = false,
  colSpan = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          className="input min-h-24 resize-none"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="input"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function HomeProfilePage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<"freelancer" | "company" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [hasCv, setHasCv] = useState(false);
  const [cvName, setCvName] = useState("");
  const [cvUploading, setCvUploading] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const set = (key: string) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  useEffect(() => {
    const id = Number(localStorage.getItem("userId") || 0);
    const userRole = localStorage.getItem("userRole") as
      | "freelancer"
      | "company"
      | null;
    if (!id || !userRole) return;

    setUserId(id);
    setRole(userRole);

    const cacheKey = `user:profile:${id}`;
    const cached = getCachedValue<Record<string, string>>(
      cacheKey,
      1000 * 60 * 30,
    );

    if (cached) {
      setForm(cached);
      if (cached.cv_path) {
        setHasCv(true);
        setCvName((cached.cv_path as string).split("/").pop() || "cv");
      }
      return;
    }

    api.get(`/users/${id}`).then((res) => {
      const next = res.data || {};
      setForm(next);
      setCachedValue(cacheKey, next);
      if (next.cv_path) {
        setHasCv(true);
        setCvName(next.cv_path.split("/").pop() || "cv");
      }
    });
  }, []);

  const uploadCv = async (file: File) => {
    if (!userId) return;
    setCvUploading(true);
    try {
      const fd = new FormData();
      fd.append("cv", file);
      await api.post(`/users/${userId}/cv`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setHasCv(true);
      setCvName(file.name);
    } finally {
      setCvUploading(false);
    }
  };

  const save = async () => {
    if (!userId) return;
    setError("");
    setStatus("");
    try {
      const res = await api.put(`/users/${userId}`, form);
      const next = res.data?.user || form;
      setForm(next);
      setCachedValue(`user:profile:${userId}`, next);
      setStatus("Profile updated successfully.");
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        e.response?.data?.message || e.message || "Profile update failed.",
      );
    }
  };

  return (
    <SectionShell
      title="Profile"
      description="Manage and update your account details."
      actions={
        <button className="btn" onClick={save}>
          Save Changes
        </button>
      }
    >
      {(status || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || status}
        </div>
      )}

      {role === "freelancer" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            CV / Resume
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {hasCv ? (
              <>
                <span className="flex items-center gap-1.5 text-sm text-emerald-700">
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
              </>
            ) : (
              <button
                onClick={() => cvInputRef.current?.click()}
                disabled={cvUploading}
                className="flex items-center gap-2 text-sm text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition disabled:opacity-50"
              >
                <Paperclip className="w-4 h-4" />
                {cvUploading ? "Uploading…" : "Upload CV (PDF / DOC)"}
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

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Shared fields */}
          <Field
            label="Email Address"
            value={form.email || ""}
            onChange={set("email")}
            placeholder="you@example.com"
            type="email"
          />
          <Field
            label="Phone Number"
            value={form.phone_number || ""}
            onChange={set("phone_number")}
            placeholder="+1 555 000 0000"
          />

          {role === "freelancer" && (
            <>
              <Field
                label="First Name"
                value={form.first_name || ""}
                onChange={set("first_name")}
                placeholder="John"
              />
              <Field
                label="Last Name"
                value={form.last_name || ""}
                onChange={set("last_name")}
                placeholder="Doe"
              />
              <Field
                label="Freelance Category"
                value={form.freelance_category || ""}
                onChange={set("freelance_category")}
                placeholder="e.g. Web Development, Design, Marketing"
                colSpan
              />
              <Field
                label="Professional Bio"
                value={form.professional_bio || ""}
                onChange={set("professional_bio")}
                placeholder="Write a short bio about yourself..."
                multiline
                colSpan
              />
            </>
          )}

          {role === "company" && (
            <>
              <Field
                label="Company Name"
                value={form.company_name || ""}
                onChange={set("company_name")}
                placeholder="Acme Corp"
                colSpan
              />
              <Field
                label="Industry"
                value={form.industry || ""}
                onChange={set("industry")}
                placeholder="e.g. Technology, Healthcare, Finance"
              />
              <Field
                label="Contact First Name"
                value={form.contact_first_name || ""}
                onChange={set("contact_first_name")}
                placeholder="Jane"
              />
              <Field
                label="Contact Last Name"
                value={form.contact_last_name || ""}
                onChange={set("contact_last_name")}
                placeholder="Smith"
              />
              <Field
                label="Company Description"
                value={form.company_description || ""}
                onChange={set("company_description")}
                placeholder="Describe what your company does and what makes it a great place to work..."
                multiline
                colSpan
              />
            </>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
