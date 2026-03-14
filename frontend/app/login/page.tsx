"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  useEffect(() => {
    setMounted(true);
    // Check for saved email if remember me was checked
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail, rememberMe: true }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");
  setSuccess("");

  if (!formData.email || !formData.password) {
    setError("Please fill in all fields");
    setIsLoading(false);
    return;
  }

  if (!formData.email.includes('@')) {
    setError("Please enter a valid email address");
    setIsLoading(false);
    return;
  }

  try {
    const res = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Login failed");
    }

    localStorage.setItem("token", data.access_token);

    if (formData.rememberMe) {
      localStorage.setItem("savedEmail", formData.email);
    } else {
      localStorage.removeItem("savedEmail");
    }
    

    router.push("/dashboard");

  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};

  if (!mounted) {
    return null;
  }

  return (
    <div className="login-page">
      {/* Animated Background Particles */}
      <div className="login-bg-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="login-wrapper">
        {/* Left Side - Brand Section */}
        <div className="login-brand">
          <div className="login-brand-content">
            <span className="brand-badge">🚀 AI-Powered Incident Intelligence</span>
            
            <h1>
              Welcome back to<br />
              <span>ANKY</span>
            </h1>
            
            <p>
              Access your AI-powered support assistant and continue<br />
              where you left off.
            </p>

            {/* Quick Stats */}
            <div className="brand-stats">
              <div className="stat-item">
                <div className="stat-number">40-50%</div>
                <div className="stat-label">Faster Diagnosis</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">100k+</div>
                <div className="stat-label">Incidents Analyzed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Teams</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="login-card">
          <div className="login-card-header">
            <div className="logo-wrapper">
              <div className="logo-glow"></div>
              <Image 
                src="/anky_logo.png"
                alt="ANKY Logo"
                width={130}
                height={130}
                priority
              />
            </div>
            <h2>Sign in</h2>
            <p>Access your ANKY dashboard</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              <span>✓</span> {success}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68197 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.07888 11.2931 3.99834 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19M14.12 14.12C13.8454 14.4147 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="form-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="button-loader"></span>
                  Signing in...
                </>
              ) : (
                "Sign in →"
              )}
            </button>

            {/* Signup Link */}
            <div className="signup-prompt">
              <p>
                Don't have an account?{' '}
                <Link href="/signup" className="signup-link">
                  Create free account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}