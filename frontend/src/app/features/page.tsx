"use client";

import Link from "next/link";
import Header from "@/components/landing/Header";

const features = [
  {
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.5 2C8.67 2 8 2.67 8 3.5V5H4C2.9 5 2 5.9 2 7V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V7C22 5.9 21.1 5 20 5H16V3.5C16 2.67 15.33 2 14.5 2H9.5M9.5 3.5H14.5V6.5H9.5V3.5M7 9H10V12H7V9M11 9H17V11H11V9M11 12H17V14H11V12M7 13H10V16H7V13M7 17H10V20H7V17M11 15H17V17H11V15M11 18H17V20H11V18Z" />
      </svg>
    ),
    gradient: "from-blue-500 to-indigo-600",
    title: "AI Proposal Generator",
    description:
      "Automatically generates tailored cover letters and proposals based on job descriptions. Choose your tone and focus area for perfect personalization.",
    items: [
      "Multiple tone options",
      "Industry-specific templates",
      "Real-time optimization",
    ],
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
      </svg>
    ),
    gradient: "from-purple-500 to-pink-600",
    title: "Smart Job Matcher",
    description:
      "Aggregates freelance jobs across platforms in real-time. Uses NLP to match jobs to your skills and preferences automatically.",
    items: [
      "Multi-platform scraping",
      "AI-powered matching",
      "Real-time alerts",
    ],
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16,17V19H2V17S2,13 9,13 16,17 16,17M12.5,7.5A3.5,3.5 0 0,1 9,11A3.5,3.5 0 0,1 5.5,7.5A3.5,3.5 0 0,1 9,4A3.5,3.5 0 0,1 12.5,7.5M15.94,13A5.32,5.32 0 0,1 18,17V19H22V17S22,13.37 15.94,13M15,4A3.39,3.39 0 0,0 13.07,4.59A5,5 0 0,1 13.07,10.41A3.39,3.39 0 0,0 15,11A3.5,3.5 0 0,0 18.5,7.5A3.5,3.5 0 0,0 15,4Z" />
      </svg>
    ),
    gradient: "from-red-500 to-orange-600",
    title: "Smart CRM",
    description:
      "Organize and track outreach campaigns, lead status, email opens, and response rates. Auto-follows up with intelligent reminders.",
    items: ["Automated follow-ups", "Response tracking", "Lead scoring"],
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20,6H12L10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6Z" />
      </svg>
    ),
    gradient: "from-green-500 to-teal-600",
    title: "Dynamic Portfolio",
    description:
      "Automatically injects relevant portfolio items and testimonials into each proposal based on job requirements.",
    items: ["AI-powered selection", "Automatic insertion", "Relevance scoring"],
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z" />
      </svg>
    ),
    gradient: "from-cyan-500 to-blue-600",
    title: "Meeting Scheduler",
    description:
      "Let clients schedule meetings directly from proposal links. Auto-responds to inquiries using trained GPT assistant.",
    items: [
      "Direct booking links",
      "Calendar integration",
      "AI auto-responses",
    ],
  },
  {
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3,3H11V11H3V3M13,3H21V11H13V3M3,13H11V21H3V13M18,13L23,18L18,23L13,18L18,13Z" />
      </svg>
    ),
    gradient: "from-yellow-500 to-red-600",
    title: "Analytics Dashboard",
    description:
      "Visualize proposal performance, response rates, win rates, and client behavior patterns for continuous improvement.",
    items: ["Performance metrics", "Win rate tracking", "Client insights"],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white py-24 overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-300 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium">AI-Powered Automation</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-red-100">
            Powerful Features for Freelancers
          </h1>
          <p className="text-xl sm:text-2xl text-red-50 max-w-3xl mx-auto leading-relaxed">
            Everything you need to automate your client outreach and land more
            projects
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-50/30 to-transparent pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-red-200 hover:-translate-y-2"
              >
                {/* Gradient background on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`}
                ></div>

                {/* Icon with gradient */}
                <div
                  className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                {/* Feature Items */}
                <ul className="space-y-3">
                  {feature.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                      <span className="text-gray-700 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-8 border border-white/20">
            <svg
              className="w-4 h-4 text-yellow-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium text-white">
              Join 2,500+ Freelancers
            </span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Freelance Career?
          </h2>
          <p className="text-xl text-red-50 mb-10 leading-relaxed">
            Start landing more clients with AI-powered automation. No credit
            card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="group px-8 py-4 bg-white text-red-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center gap-2"
            >
              Start Free Trial
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all border-2 border-white/30 hover:border-white/50"
            >
              Learn More
            </Link>
          </div>

          <p className="mt-8 text-red-100 text-sm">
            ✓ 14-day free trial ✓ No credit card required ✓ Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
