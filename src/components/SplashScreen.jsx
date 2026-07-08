import React, { useState, useEffect } from "react";
import logo from "../assets/VyaparOs.png";

export default function SplashScreen({ onFinished }) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = 2200; // Total loading duration in ms
    const intervalTime = 20; // Update progress every 20ms
    const totalSteps = duration / intervalTime;
    const increment = 100 / totalSteps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Allow a brief pause at 100% before starting the transition
          setTimeout(() => {
            setIsExiting(true);
          }, 300);
          return 100;
        }
        // Slightly randomize increments to look more realistic
        const randomFactor = 0.5 + Math.random();
        const nextProgress = prev + (increment * randomFactor);
        return Math.min(100, nextProgress);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Trigger the completion callback after the fade-out CSS animation concludes
  useEffect(() => {
    if (isExiting) {
      const exitTimer = setTimeout(() => {
        if (onFinished) {
          onFinished();
        }
      }, 400); // Sync with CSS transition duration (0.4s)
      return () => clearTimeout(exitTimer);
    }
  }, [isExiting, onFinished]);

  // Determine sub-label based on current progress
  const getStatusMessage = () => {
    if (progress < 25) return "Initializing core modules...";
    if (progress < 55) return "Securing database connection...";
    if (progress < 80) return "Loading system configurations...";
    if (progress < 95) return "Setting up workspace interfaces...";
    return "Ready!";
  };

  return (
    <div className={`splash-backdrop ${isExiting ? "fade-out" : ""}`}>
      <div className="splash-card">
        <div className="splash-logo-container">
          <img src={logo} alt="VyapaarOS Logo" className="splash-logo" />
        </div>
        <h1 className="splash-title">VyapaarOS</h1>
        <p className="splash-subtitle">The Precision Atelier</p>

        <div className="splash-progress-wrapper">
          <div className="splash-progress-track">
            <div 
              className="splash-progress-bar" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="splash-info-row">
            <span className="splash-status">{getStatusMessage()}</span>
            <span className="splash-percentage">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
