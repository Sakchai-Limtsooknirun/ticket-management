import React from 'react';
import '../styles/Hero.css';

interface HeroProps {
  onCreateRequest: () => void;
}

const Hero: React.FC<HeroProps> = ({ onCreateRequest }) => {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-logo">
          <span>System</span>
          <div className="system-icon">⚙️</div>
        </div>
        <div className="hero-text">
          <h2>Request Ticket & Approval System</h2>
          <h3>Chemical Configuration Management</h3>
        </div>
        <button className="cta-button" onClick={onCreateRequest}>
          Create New Request
        </button>
      </div>
      <div className="hero-dots">
        <span className="dot active"></span>
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </section>
  );
};

export default Hero; 