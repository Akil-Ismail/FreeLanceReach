"use client";

import Link from "next/link";
import Image from "next/image";
import heroImage from "../../../public/images/hero-team.avif";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-red-600 to-red-700 text-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Smart AI-Powered Client Outreach for Freelancers
            </h1>

            <p className="text-lg sm:text-xl text-red-50 leading-relaxed max-w-2xl">
              Automate your entire client outreach process — from discovering
              relevant jobs to crafting personalized proposals, intelligent
              follow-ups, and booking calls. Your personal sales assistant.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-white text-red-600 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
              >
                Start Free Trial
              </Link>
              <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-red-600 transition-all">
                Watch Demo
              </button>
            </div>

            {/* Features List */}
            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <div className="flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-lg">No Setup Required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-lg">14-Day Free Trial</span>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
              {/* Response Rate Badge */}
              <div className="absolute top-6 left-6 rounded-xl px-5 py-3 shadow-xl z-10 backdrop-blur-sm bg-white/95">
                <div className="text-4xl font-bold text-red-600">95%</div>
                <div className="text-sm font-medium text-gray-600">
                  Response Rate
                </div>
              </div>

              {/* Active Users Badge */}
              <div className="absolute top-6 right-6 rounded-xl px-4 py-2 shadow-xl z-10 backdrop-blur-sm bg-white/95">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white"></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    2.5k+ users
                  </span>
                </div>
              </div>

              {/* Success Notification */}
              <div className="absolute bottom-6 left-6 rounded-xl px-4 py-3 shadow-xl z-10 backdrop-blur-sm bg-white/95 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    Proposal Sent!
                  </div>
                  <div className="text-xs text-gray-500">AI crafted in 30s</div>
                </div>
              </div>

              {/* Team Image */}
              <div className="relative aspect-[4/3]">
                <Image
                  src={heroImage}
                  alt="Freelance team collaboration"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Overlay gradient for better badge visibility */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
