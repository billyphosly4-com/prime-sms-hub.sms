// src/pages/Login.jsx
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../firebasejs/config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import "./Login.css";

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setResetMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      return setError("Please enter email and password.");
    }

    setLoading(true);

    try {
      // Sign in user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;
      console.log("Login successful:", user.uid);

      // Update last login in Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          lastLogin: serverTimestamp()
        });
      } catch (firestoreError) {
        console.warn("Could not update last login:", firestoreError);
        // Continue even if Firestore update fails
      }

      // Redirect to dashboard - THIS IS THE KEY FIX
      if (onNavigate) {
        console.log("Redirecting to dashboard...");
        onNavigate("dashboard");
      } else {
        console.error("onNavigate function not provided");
        // Fallback - try to use window.location as last resort
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Login error:", err);

      switch (err.code) {
        case "auth/invalid-email":
          setError("Invalid email format.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/too-many-requests":
          setError("Too many attempts. Try again later.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Check your internet.");
          break;
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        default:
          setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      return setError("Enter your email above first.");
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage("Password reset email sent. Check your inbox.");
      setError("");
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Could not send reset email. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/hero.png" alt="PrimeSmsHub" className="login-logo" />
          <h1>Welcome Back 👋</h1>
          <p>Login to your PrimeSmsHub account</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {resetMessage && (
          <div className="success-message">
            ✅ {resetMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div
            className="forgot-password"
            onClick={handlePasswordReset}
          >
            Forgot Password?
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{" "}
            <span
              onClick={() => onNavigate && onNavigate('signup')}
              className="link"
            >
              Sign Up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}