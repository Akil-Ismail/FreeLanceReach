"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/landing/Header";
import api from "@/lib/api";

const freelanceCategories = [
  "Software Engineer",
  "Web Developer",
  "Mobile Developer",
  "UI/UX Designer",
  "Graphic Designer",
  "Content Writer",
  "Copywriter",
  "Digital Marketer",
  "SEO Specialist",
  "Social Media Manager",
  "Video Editor",
  "Photographer",
  "Translator",
  "Virtual Assistant",
  "Data Analyst",
  "Accountant",
  "Architect",
  "Civil Engineer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Plumber",
  "Carpenter",
  "Electrician",
  "HVAC Technician",
  "Consultant",
  "Project Manager",
  "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    category: "",
    bio: "",
    cv: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, cv: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords don't match!");
      }

      // Prepare form data for multipart upload
      const submitData = new FormData();
      submitData.append("first_name", formData.firstName);
      submitData.append("last_name", formData.lastName);
      submitData.append("email", formData.email);
      submitData.append("phone_number", formData.phone);
      submitData.append("freelance_category", formData.category);
      submitData.append("professional_bio", formData.bio);
      submitData.append("password", formData.password);
      submitData.append("password_confirmation", formData.confirmPassword);

      if (formData.cv) {
        submitData.append("cv", formData.cv);
      }

      const response = await api.post("/register/freelancer", submitData);

      // Store auth info
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
      localStorage.setItem("userRole", "freelancer");
      if (response.data.user?.id) {
        const newUserId = String(response.data.user.id);
        localStorage.setItem("userId", newUserId);
        localStorage.setItem(`profileSetupComplete:${newUserId}`, "false");
        localStorage.setItem(
          `user:profile:${newUserId}`,
          JSON.stringify({
            value: response.data.user,
            savedAt: Date.now(),
          }),
        );
      }

      router.push("/home/setup");
    } catch (err) {
      const error = err as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
        message?: string;
      };
      let errorMessage = "Signup failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors)
          .flat()
          .join(", ");
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Join as a Freelancer
            </h1>
            <p className="mt-2 text-gray-600">
              Start landing your dream clients today
            </p>
          </div>

          {/* Signup Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Name Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    disabled={isLoading}
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    disabled={isLoading}
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="text"
                  disabled={isLoading}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  disabled={isLoading}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Category/Profession */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Freelance Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                >
                  <option value="">Select your profession</option>
                  {freelanceCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bio */}
              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Professional Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="bio"
                  required
                  rows={4}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us about your skills and experience..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Minimum 10 characters
                </p>
              </div>

              {/* CV Upload */}
              <div>
                <label
                  htmlFor="cv"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Upload CV/Resume{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    id="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="cv"
                    className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors"
                  >
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        {formData.cv ? (
                          <span className="text-red-600 font-medium">
                            {formData.cv.name}
                          </span>
                        ) : (
                          <>
                            <span className="text-red-600 font-medium">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX up to 10MB
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-1 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isLoading
                  ? "Creating Account..."
                  : "Create Freelancer Account"}
              </button>
            </form>

            {/* Company Signup Link */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Looking to hire freelancers?{" "}
                <Link
                  href="/signup/company"
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Sign up as a company
                </Link>
              </p>
            </div>

            {/* Login Link */}
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
