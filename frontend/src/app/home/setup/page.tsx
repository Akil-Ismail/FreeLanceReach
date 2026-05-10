"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Send,
  Bot,
  AlertTriangle,
  Paperclip,
} from "lucide-react";
import api, { fastApi } from "@/lib/api";
import { setCachedValue } from "@/lib/localCache";

type Msg = { role: "user" | "assistant"; content: string };

/* ---------- role-specific questions ---------- */
const FREELANCER_QUESTIONS = [
  {
    key: "headline",
    label: "Professional Headline",
    hint: "e.g. Senior React Developer",
  },
  {
    key: "skills",
    label: "Top Skills",
    hint: "e.g. React, TypeScript, Node.js",
  },
  {
    key: "experience_level",
    label: "Experience Level",
    hint: "entry / intermediate / senior / expert",
  },
  { key: "hourly_rate", label: "Hourly Rate (USD)", hint: "e.g. 45" },
  { key: "bio", label: "Professional Bio", hint: "2–3 sentences about you" },
  {
    key: "portfolio_url",
    label: "Portfolio / GitHub URL",
    hint: "https://... or skip",
  },
  {
    key: "availability",
    label: "Availability",
    hint: "full-time / part-time / project-based",
  },
];

const COMPANY_QUESTIONS = [
  {
    key: "company_name",
    label: "Company Name",
    hint: "Your company's full name",
  },
  { key: "industry", label: "Industry", hint: "e.g. Technology, Healthcare" },
  {
    key: "contact_first_name",
    label: "Your First Name",
    hint: "Primary contact",
  },
  {
    key: "contact_last_name",
    label: "Your Last Name",
    hint: "Primary contact",
  },
  {
    key: "company_description",
    label: "Company Description",
    hint: "2–3 sentences about what you do",
  },
  { key: "phone_number", label: "Phone Number", hint: "Optional" },
];

function parseAnswer(key: string, raw: string): string {
  if (key === "hourly_rate") return raw.replace(/[^0-9.]/g, "") || raw;
  if (key === "portfolio_url" && /^(skip|n\/a|none|no)$/i.test(raw.trim()))
    return "";
  return raw.trim();
}

export default function SetupPage() {
  const router = useRouter();
  const role = (
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null
  ) as "freelancer" | "company" | null;
  const userId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userId") || 0)
      : 0;

  const questions =
    role === "company" ? COMPANY_QUESTIONS : FREELANCER_QUESTIONS;
  const totalSteps = questions.length;

  /* ---- state ---- */
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [allAnswered, setAllAnswered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUploaded, setCvUploaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ---- scroll to bottom on new messages ---- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---- probe AI availability and fire first question ---- */
  useEffect(() => {
    const endpoint =
      role === "company" ? "/company-chat/health" : "/freelancer-chat/health";
    fastApi
      .get(endpoint)
      .then((r) => setAiAvailable(!!r.data?.available))
      .catch(() => setAiAvailable(false));

    const welcome =
      role === "company"
        ? "Welcome! I'll guide you through setting up your employer profile with a few quick questions.\n\nLet's start — what is your **company name**?"
        : "Welcome! I'll help you build a strong freelancer profile step by step.\n\nLet's start — what is your **professional headline**? (e.g. *Senior React Developer*)";

    setMessages([{ role: "assistant", content: welcome }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- send a message & advance the wizard ---- */
  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    // Capture the answer for the current question
    const q = questions[currentQ];
    if (q) {
      const parsed = parseAnswer(q.key, text);
      const newValues = { ...formValues, [q.key]: parsed };
      setFormValues(newValues);

      const nextIdx = currentQ + 1;
      const finished = nextIdx >= totalSteps;

      if (finished) setAllAnswered(true);

      // Ask next question via AI or fallback
      const nextMsg = await fetchAIReply(text, updatedHistory, finished);
      setMessages((prev) => [...prev, { role: "assistant", content: nextMsg }]);
      if (!finished) setCurrentQ(nextIdx);
    }
  };

  const fetchAIReply = async (
    userText: string,
    history: Msg[],
    finished: boolean,
  ): Promise<string> => {
    try {
      const endpoint =
        role === "company" ? "/company-chat/chat" : "/freelancer-chat/chat";
      const res = await fastApi.post(endpoint, {
        message: userText,
        chat_history: history,
      });
      const reply: string = res.data?.response || "";
      if (reply) return reply;
    } catch {
      /* fall through */
    }

    // Static fallback
    const nextQ = questions[currentQ + 1];
    if (finished) {
      return "All done! Your profile is ready. Review the details on the right and click **Complete Setup** to continue.";
    }
    if (nextQ) {
      return `Got it! Here's the next question:\n\n**${nextQ.label}** — ${nextQ.hint}`;
    }
    return "Great answer! Keep filling in the form on the right.";
  };

  const uploadCv = async (file: File) => {
    setCvFile(file);
    setCvUploading(true);
    try {
      const fd = new FormData();
      fd.append("cv", file);
      await api.post(`/users/${userId}/cv`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCvUploaded(true);
    } catch {
      setCvFile(null);
    } finally {
      setCvUploading(false);
    }
  };

  /* ---- complete setup ---- */
  const completeSetup = async () => {
    setError("");
    setSaving(true);
    try {
      if (role === "company") {
        const res = await api.put(`/users/${userId}`, {
          company_name: formValues.company_name || "",
          contact_first_name: formValues.contact_first_name || "",
          contact_last_name: formValues.contact_last_name || "",
          industry: formValues.industry || "",
          company_description: formValues.company_description || "",
          phone_number: formValues.phone_number || "",
        });
        setCachedValue(`user:profile:${userId}`, res.data?.user || {});
      } else {
        await api.post("/freelancer-profile", {
          actor_user_id: userId,
          user_id: userId,
          headline: formValues.headline || "",
          skills: (formValues.skills || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          hourly_rate: formValues.hourly_rate
            ? Number(formValues.hourly_rate)
            : null,
          experience_level: formValues.experience_level || "",
          bio: formValues.bio || "",
          portfolio_url: formValues.portfolio_url || null,
          availability: formValues.availability || "",
        });
        setCachedValue(`user:profile:${userId}`, {
          email: localStorage.getItem("userEmail") || "",
          ...formValues,
        });
      }

      localStorage.setItem(`profileSetupComplete:${userId}`, "true");
      router.push(role === "company" ? "/home/employer" : "/home/freelancer");
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        e.response?.data?.message || e.message || "Could not save profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const progress = Math.round(
    ((currentQ + (allAnswered ? 1 : 0)) / totalSteps) * 100,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Profile Setup</p>
            <p className="text-xs text-gray-400">
              {role === "company" ? "Employer" : "Freelancer"} ·{" "}
              {currentQ + (allAnswered ? 1 : 0)} of {totalSteps} questions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {aiAvailable === false && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              AI offline — using guided questions
            </div>
          )}
          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 w-8 text-right">
            {progress}%
          </span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full p-4 sm:p-6 gap-4 lg:gap-6">
        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <Bot className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-gray-800">
              AI Setup Assistant
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-gray-50 border border-gray-200 text-gray-800"
                      : "bg-red-600 text-white"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                  }}
                />
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              className="input text-sm"
              placeholder={
                allAnswered
                  ? "All questions answered — complete setup →"
                  : questions[currentQ]?.hint || "Type your answer..."
              }
              value={input}
              disabled={allAnswered}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !allAnswered) sendMessage();
              }}
            />
            <button
              className="btn px-4 flex items-center gap-1.5 shrink-0"
              onClick={sendMessage}
              disabled={allAnswered || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Profile preview panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex-1">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">
              {role === "company" ? "Employer Profile" : "Freelancer Profile"}
            </h2>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const val = formValues[q.key] || "";
                const answered = !!val;
                const isCurrent = idx === currentQ && !allAnswered;
                return (
                  <div
                    key={q.key}
                    className={`rounded-xl border p-3 transition-all ${isCurrent ? "border-red-300 bg-red-50" : answered ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {answered ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${isCurrent ? "border-red-400" : "border-gray-300"}`}
                        />
                      )}
                      <label className="text-xs font-medium text-gray-600">
                        {q.label}
                      </label>
                    </div>
                    <input
                      className={`w-full text-xs bg-transparent outline-none text-gray-800 placeholder-gray-400 ${answered ? "" : "text-gray-400"}`}
                      placeholder={q.hint}
                      value={val}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [q.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* CV upload — freelancers only, optional */}
          {role === "freelancer" && (
            <div
              className={`rounded-xl border p-3 transition-all ${cvUploaded ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {cvUploaded ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                )}
                <span className="text-xs font-medium text-gray-600">
                  CV / Resume{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </span>
              </div>
              {cvUploaded ? (
                <p className="text-xs text-emerald-600">
                  {cvFile?.name} — uploaded ✓
                </p>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-blue-600 underline underline-offset-2">
                    {cvUploading ? "Uploading…" : "Choose PDF / DOC"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    disabled={cvUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadCv(f);
                    }}
                  />
                </label>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Complete button */}
          <button
            className={`btn w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              allAnswered ? "opacity-100" : "opacity-50 cursor-not-allowed"
            }`}
            onClick={completeSetup}
            disabled={!allAnswered || saving}
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Complete Setup
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            Answer all {totalSteps} questions to unlock the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
