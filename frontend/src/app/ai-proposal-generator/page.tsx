"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fastApi } from "@/lib/api";
import { getCachedValue } from "@/lib/localCache";

export default function AIProposalGeneratorPage() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [proposalText, setProposalText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [profile, setProfile] = useState<{
    name?: string;
    headline?: string;
    skills?: string[];
    experience_level?: string;
    bio?: string;
  }>({});

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      router.replace("/login");
      return;
    }
    const userId = localStorage.getItem("userId");
    if (userId) {
      const cached = getCachedValue<Record<string, unknown>>(
        `user:profile:${userId}`,
        1000 * 60 * 30,
      );
      if (cached) {
        setProfile({
          name:
            `${cached.first_name || ""} ${cached.last_name || ""}`.trim() ||
            undefined,
          headline: (cached.headline as string) || undefined,
          skills: Array.isArray(cached.skills)
            ? (cached.skills as string[])
            : undefined,
          experience_level: (cached.experience_level as string) || undefined,
          bio:
            (cached.bio as string) ||
            (cached.professional_bio as string) ||
            undefined,
        });
      }
    }
  }, [router]);

  const generate = async () => {
    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError("Please enter both a Job Title and Job Description.");
      return;
    }

    setError("");
    setProposalText("");
    setIsGenerating(true);
    setIsFallback(false);

    try {
      const response = await fastApi.post("/proposal-generator/generate", {
        job_title: jobTitle.trim(),
        job_description: jobDescription.trim(),
        required_skills: requiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        freelancer_profile: {
          name: profile.name || undefined,
          headline: profile.headline || undefined,
          skills: profile.skills || undefined,
          experience_level: profile.experience_level || undefined,
          bio: profile.bio || undefined,
        },
      });

      setProposalText(response.data.proposal_text || "");
      setIsFallback(response.data.fallback === true);
    } catch {
      setError(
        "Could not generate proposal. Make sure the AI service is running and GROQ_API_KEY is configured.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(proposalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/home/freelancer"
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Proposal Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Paste a job description and let Groq AI write a tailored application
            proposal for you.
          </p>
        </div>

        {/* Profile hint */}
        {profile.headline && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
            Using your profile: <strong>{profile.headline}</strong>
            {profile.skills?.length
              ? ` · Skills: ${profile.skills.slice(0, 4).join(", ")}`
              : ""}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Inputs */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Job Details
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Senior React Developer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="input min-h-40"
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Skills{" "}
                  <span className="text-gray-400 font-normal">
                    (comma-separated, optional)
                  </span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. React, TypeScript, Node.js"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              className="btn w-full py-3 text-base"
              onClick={generate}
              disabled={isGenerating}
            >
              {isGenerating
                ? "Generating proposal..."
                : "Generate Proposal with AI"}
            </button>
          </div>

          {/* Right: Output */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Generated Proposal
              </h2>
              {proposalText && (
                <button
                  className="btn-secondary text-sm px-3 py-1.5"
                  onClick={copy}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {isFallback && proposalText && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                AI service unavailable — showing a template proposal. Configure
                GROQ_API_KEY for full AI generation.
              </div>
            )}

            {isGenerating ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Groq AI is writing your proposal...
                  </p>
                </div>
              </div>
            ) : proposalText ? (
              <div className="flex-1 flex flex-col gap-3">
                <textarea
                  className="input flex-1 min-h-72 resize-none text-sm leading-relaxed"
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  You can edit the proposal above before copying or submitting
                  it.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-gray-400 text-center">
                  Your AI-generated proposal will appear here.
                  <br />
                  Fill in the job details and click Generate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
