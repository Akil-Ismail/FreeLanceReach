"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/landing/Header";
import api from "@/lib/api";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rolePicker, setRolePicker] = useState<{ token: string; user: Record<string, unknown> } | null>(null);

  const storeAuthAndRedirect = (token: string, user: Record<string, unknown>, isGoogle = false) => {
    localStorage.setItem("authToken", token);
    if (isGoogle) localStorage.setItem("googleAuth", "true");
    const role = (user.role as string) || "freelancer";
    const email = (user.email as string) || "";
    const id = user.id as number;
    localStorage.setItem("userRole", role);
    localStorage.setItem("userEmail", email);
    if (id) {
      localStorage.setItem("userId", String(id));
      localStorage.setItem(`user:profile:${id}`, JSON.stringify({ value: user, savedAt: Date.now() }));
    }
    const setupComplete = id
      ? localStorage.getItem(`profileSetupComplete:${id}`) === "true"
      : false;
    router.push(setupComplete ? (role === "company" ? "/home/employer" : "/home/freelancer") : "/home/setup");
  };

  const handleGoogleRole = async (role: "freelancer" | "company") => {
    if (!rolePicker) return;
    setIsLoading(true);
    setRolePicker(null);
    try {
      const res = await api.post("/auth/google/set-role", {
        user_id: rolePicker.user.id,
        role,
      });
      storeAuthAndRedirect(rolePicker.token, { ...rolePicker.user, role: res.data.user?.role || role }, true);
    } catch {
      storeAuthAndRedirect(rolePicker.token, { ...rolePicker.user, role }, true);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError("");
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        const res = await api.post("/auth/google", {
          credential: tokenResponse.access_token,
          email: userInfo.email,
          first_name: userInfo.given_name,
          last_name: userInfo.family_name,
        });

        // Existing user — go straight in
        if (!res.data.is_new_user) {
          storeAuthAndRedirect(res.data.token, res.data.user, false);
          return;
        }

        // New user — ask role before proceeding
        setRolePicker({ token: res.data.token, user: res.data.user });
      } catch (err) {
        const e = err as { response?: { data?: { message?: string; detail?: string } }; message?: string };
        setError(e.response?.data?.message || e.response?.data?.detail || e.message || "Google sign-in failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/login", {
        email: formData.email,
        password: formData.password,
      });

      // Store auth token and user role from response
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
      const userRole = response.data.user?.role || null; // Default to null if role is not provided
      localStorage.setItem("userRole", userRole);
      const userEmail = response.data.user?.email || null; // Default to null if email is not provided
      localStorage.setItem("userEmail", userEmail);
      const userId = response.data.user?.id || null;
      if (userId) {
        localStorage.setItem("userId", String(userId));
        localStorage.setItem(
          `user:profile:${userId}`,
          JSON.stringify({
            value: response.data.user,
            savedAt: Date.now(),
          }),
        );
      }

      const setupComplete = userId
        ? localStorage.getItem(`profileSetupComplete:${userId}`) === "true"
        : false;

      if (!setupComplete) {
        router.push("/home/setup");
      } else {
        router.push(
          userRole === "company" ? "/home/employer" : "/home/freelancer",
        );
      }
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.message ||
          error.message ||
          "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            {/* <p className="mt-2 text-gray-600">Sign in to your account</p> */}
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Account Type */}
              {/* <div>
                <label
                  htmlFor="userType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  I am logging in as:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, userType: "freelancer" })
                    }
                    className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                      formData.userType === "freelancer"
                        ? "border-red-600 bg-red-50 text-red-600"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    💼 Freelancer
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, userType: "company" })
                    }
                    className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                      formData.userType === "company"
                        ? "border-red-600 bg-red-50 text-red-600"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    🏢 Company
                  </button>
                </div>
              </div> */}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={isLoading}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  disabled={isLoading}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 disabled:cursor-not-allowed"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => googleLogin()} disabled={isLoading} className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Google
                </span>
              </button>
              <button type="button" onClick={() => setError("GitHub sign-in is not available yet.")} className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  GitHub
                </span>
              </button>
            </div>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Sign up as a freelancer
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-gray-600">
              Looking to hire?{" "}
              <Link
                href="/signup/company"
                className="text-red-600 hover:text-red-700 font-semibold"
              >
                Sign up as a company
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Role picker modal for new Google users */}
      {rolePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-1">One last step</h2>
            <p className="text-sm text-gray-400 text-center mb-6">How will you be using FreelanceReach?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-xl border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all group disabled:opacity-50"
                onClick={() => handleGoogleRole("freelancer")}
                disabled={isLoading}
              >
                <span className="text-2xl">💼</span>
                <span className="text-sm font-semibold text-gray-800 group-hover:text-red-600">Freelancer</span>
                <span className="text-xs text-gray-400 text-center">Find work &amp; clients</span>
              </button>
              <button
                className="flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-xl border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 transition-all group disabled:opacity-50"
                onClick={() => handleGoogleRole("company")}
                disabled={isLoading}
              >
                <span className="text-2xl">🏢</span>
                <span className="text-sm font-semibold text-gray-800 group-hover:text-red-600">Company</span>
                <span className="text-xs text-gray-400 text-center">Hire freelancers</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
