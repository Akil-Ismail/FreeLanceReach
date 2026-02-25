"use client";

import { useState } from "react";
import { Copy, Sparkles, Loader } from "lucide-react";
import { Toast } from "@/components/common/Toast";

interface GeneratorFormData {
  jobDescription: string;
  platform: "upwork" | "fiverr" | "linkedin";
  tone: "professional" | "friendly" | "confident" | "persuasive";
  focus: "technical" | "experience" | "portfolio" | "results";
}

const DUMMY_PROPOSALS = {
  professional: `Dear Hiring Manager,

I am writing to express my strong interest in this position. With extensive experience in delivering high-quality solutions, I am confident in my ability to exceed your expectations.

My expertise includes [your relevant skills] and I have successfully delivered [number] projects with a [success metric]. I understand the importance of deadline adherence and quality output, and I pride myself on delivering both consistently.

I would welcome the opportunity to discuss how I can contribute to your team. Thank you for considering my application.

Best regards`,

  friendly: `Hey! Thanks so much for posting this – it looks right up my alley! 🎉

I'm really excited about this opportunity because I genuinely love working on [project type] and I've had amazing results with similar projects before. I've helped [number] clients achieve [specific results], and I'm confident I can do the same for you.

What I love about my approach is breaking down complex problems into simple, manageable steps. I'm not just looking to complete tasks – I want to build something great together that you'll be proud of.

Let's chat! I'd love to hear more about what you're looking for.

Cheers!`,

  confident: `I'm the right person for this job.

I've completed [number] similar projects with a [success rate]% success rate. My technical skills in [technologies] are sharp, and I consistently deliver work that exceeds client expectations.

Here's what sets me apart:
• Faster turnaround without compromising quality
• Proactive problem-solving mindset  
• Strong communication and reliability
• Track record of positive testimonials

I'm ready to start immediately and deliver results that speak for themselves.

Let's make this happen.`,

  persuasive: `I can solve your [specific problem] in [timeframe].

Here's why you should hire me:

1. **Proven Track Record**: [Specific achievement] resulted in [measurable outcome]
2. **Right Expertise**: My [X] years in [field] directly matches your needs
3. **Efficiency**: Similar projects completed in [timeframe] with [quality metric]
4. **Your Success**: My incentive is your complete satisfaction – I don't consider work done until you're 100% happy

The sooner we start, the sooner you get results. Let's discuss how I can add value to your project.

Ready when you are.`,
};

interface AIProposalGeneratorProps {
  userRole: string;
}

export const AIProposalGenerator = ({ userRole }: AIProposalGeneratorProps) => {
  const [formData, setFormData] = useState<GeneratorFormData>({
    jobDescription: "",
    platform: "upwork",
    tone: "professional",
    focus: "technical",
  });

  const [generatedProposal, setGeneratedProposal] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateProposal = async () => {
    if (!formData.jobDescription.trim()) {
      setToast({ message: "Please enter a job description", type: "error" });
      return;
    }

    setIsLoading(true);

    // Simulate API call with loading delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const proposal = DUMMY_PROPOSALS[formData.tone];
    setGeneratedProposal(proposal);
    setIsLoading(false);
    setToast({ message: "Proposal generated successfully!", type: "success" });
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedProposal);
    setToast({ message: "Copied to clipboard!", type: "success" });
  };

  const handleProposalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedProposal(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome, {userRole === "freelancer" ? "Freelancer" : "Company"} 👋
          </h1>
          <p className="text-slate-400">
            Generate compelling proposals powered by AI to win more clients
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 sticky top-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Generate Proposal
              </h2>

              {/* Job Description */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-white mb-2">
                  Job Description
                </label>
                <textarea
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Paste the job description here..."
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                  rows={5}
                />
              </div>

              {/* Platform Select */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-white mb-2">
                  Platform
                </label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  <option value="upwork">Upwork</option>
                  <option value="fiverr">Fiverr</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>

              {/* Tone Select */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-white mb-2">
                  Tone
                </label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="confident">Confident</option>
                  <option value="persuasive">Persuasive</option>
                </select>
              </div>

              {/* Focus Select */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-2">
                  Focus Area
                </label>
                <select
                  name="focus"
                  value={formData.focus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                >
                  <option value="technical">Technical Skills</option>
                  <option value="experience">Experience</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="results">Results</option>
                </select>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateProposal}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Proposal
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Proposal Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Generated Proposal
                </h2>
                {generatedProposal && (
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition-all duration-200"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                )}
              </div>

              {generatedProposal ? (
                <textarea
                  value={generatedProposal}
                  onChange={handleProposalChange}
                  className="w-full h-96 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none font-mono text-sm"
                  placeholder="Your generated proposal will appear here..."
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center bg-slate-700/20 border border-dashed border-slate-600 rounded-lg">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                    <p className="text-slate-400">
                      Generate a proposal to see it here
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      Fill in the form and click Generate Proposal
                    </p>
                  </div>
                </div>
              )}

              {/* Tips */}
              {!generatedProposal && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-400 mb-2">
                    💡 Tips for better proposals:
                  </h3>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>• Be specific about the job requirements</li>
                    <li>• Include relevant keywords from the job posting</li>
                    <li>• Choose a tone that matches the client</li>
                    <li>
                      • Edit the generated proposal to add personal touches
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
