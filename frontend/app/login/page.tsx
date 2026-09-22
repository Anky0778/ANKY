"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight } from "lucide-react";
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
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
            <span className="brand-badge"><Sparkles size={14} /> AI-Powered Incident Intelligence</span>
            
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
                <div className="stat-number">1000+</div>
                <div className="stat-label">Incidents Analyzed</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">3+</div>
                <div className="stat-label">Live Workspace</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="login-card">
          <div className="login-card-header">
            <div className="logo-wrapper">
              <Image 
                src="/anky_logo.png"
                alt="ANKY Logo"
                width={72}
                height={72}
                priority
              />
            </div>
            <h2>Sign in</h2>
            <p>Access your ANKY dashboard</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          
          {success && (
            <div className="success-message">
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <span className="input-icon"><Mail size={16} /></span>
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
                <span className="input-icon"><Lock size={16} /></span>
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>

            {/* Signup Link */}
            <div className="signup-prompt">
              <p>
                Don&apos;t have an account?{' '}
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