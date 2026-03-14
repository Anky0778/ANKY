"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./signup.css";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    company: "",
    role: "support-engineer", // Default to support engineer
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showRequirements, setShowRequirements] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    setError("");

    // Calculate password strength
    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Contains number
    if (/\d/.test(password)) strength += 1;
    
    // Contains special character
    if (/[!@#$%^&*]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    setPasswordStrength(Math.min(strength, 3));
  };

  const getStrengthLabel = () => {
    switch(passwordStrength) {
      case 0: return "Very Weak";
      case 1: return "Weak";
      case 2: return "Medium";
      case 3: return "Strong";
      default: return "";
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!formData.email.includes('@')) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (!formData.company.trim()) {
      setError("Company name is required");
      return false;
    }
    if (!formData.role) {
      setError("Please select your role");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  setIsLoading(true);
  setError("");
  setSuccess("");

  try {
    const res = await fetch("http://localhost:8000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        company: formData.company,
        role: formData.role
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Registration failed");
    }

    localStorage.setItem("token", data.access_token);

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
    <div className="signup-page">
      {/* Animated Background Particles */}
      <div className="signup-bg-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="signup-wrapper">
        {/* Left Side - Brand Section */}
        <div className="signup-brand">
          <div className="signup-brand-content">
            <span className="brand-badge">✨ Join the Future of Incident Management</span>
            
            <h1>
              Streamline your<br />
              <span>incident response</span><br />
              with ANKY
            </h1>
            
            <p>
              Join 500+ support teams using ANKY to cut incident diagnosis time in half.
              No credit card required.
            </p>

            {/* Feature List */}
            <div className="brand-features">
              <div className="feature-item">
                <div className="feature-icon">🚀</div>
                <span className="feature-text">AI-powered root cause analysis</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📚</div>
                <span className="feature-text">Instant access to historical incidents</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <span className="feature-text">50% faster incident resolution</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <span className="feature-text">Enterprise-grade security</span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="brand-stats">
              <div className="stat-card">
                <div className="stat-number">40-50%</div>
                <div className="stat-label">Faster Diagnosis</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">100k+</div>
                <div className="stat-label">Incidents Analyzed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Uptime SLA</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">24/7</div>
                <div className="stat-label">AI Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Card */}
        <div className="signup-card">
          <div className="signup-card-header">
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
            <h2>Create your account</h2>
            <p>Join ANKY and transform your incident management</p>
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

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="signup-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Work Email</label>
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
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  onFocus={() => setShowRequirements(true)}
                  onBlur={() => setShowRequirements(false)}
                  autoComplete="new-password"
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <>
                  <div className="password-strength">
                    <div 
                      className={`strength-bar ${
                        passwordStrength === 1 ? 'weak' : 
                        passwordStrength === 2 ? 'medium' : 
                        passwordStrength === 3 ? 'strong' : ''
                      }`}
                    ></div>
                  </div>
                  <div className="strength-text">
                    Password strength: {getStrengthLabel()}
                  </div>
                </>
              )}

              {/* Password Requirements */}
              {showRequirements && (
                <div className="password-requirements">
                  <div className={`requirement-item ${formData.password.length >= 8 ? 'met' : ''}`}>
                    {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                  </div>
                  <div className={`requirement-item ${/\d/.test(formData.password) ? 'met' : ''}`}>
                    {/\d/.test(formData.password) ? '✓' : '○'} Contains a number
                  </div>
                  <div className={`requirement-item ${/[!@#$%^&*]/.test(formData.password) ? 'met' : ''}`}>
                    {/[!@#$%^&*]/.test(formData.password) ? '✓' : '○'} Contains a special character
                  </div>
                  <div className={`requirement-item ${/[A-Z]/.test(formData.password) ? 'met' : ''}`}>
                    {/[A-Z]/.test(formData.password) ? '✓' : '○'} Contains an uppercase letter
                  </div>
                </div>
              )}
            </div>

            {/* Company and Role - Two Column */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <div className="input-wrapper">
                  <span className="input-icon">🏢</span>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    placeholder="Company name"
                    value={formData.company}
                    onChange={handleChange}
                    disabled={isLoading}
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <div className="input-wrapper">
                  <span className="input-icon">👔</span>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="role-select"
                  >
                    <option value="support-engineer">Support Engineer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="signup-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="button-loader"></span>
                  Creating account...
                </>
              ) : (
                "Create account →"
              )}
            </button>

            <div className="divider">
              <span className="divider-line"></span>
              <span className="divider-text">Already have an account?</span>
              <span className="divider-line"></span>
            </div>

            <div className="login-prompt">
              <p>
                <Link href="/login" className="login-link">
                  Sign in to existing account
                </Link>
              </p>
            </div>

            <div className="terms-text">
              By creating an account, you agree to receive product updates and 
              marketing communications. You can unsubscribe at any time.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}