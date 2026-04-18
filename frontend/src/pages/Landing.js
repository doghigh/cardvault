import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/dashboard');
  };

  const handleGetStarted = () => {
    navigate('/scanner');
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to CardVault</h1>
        <p style={styles.subtitle}>
          Inventory, scan, organize, and track the value of your trading card collection.
        </p>

        <div style={styles.buttonRow}>
          <button style={styles.primaryButton} onClick={handleLogin}>
            Login
          </button>
          <button style={styles.secondaryButton} onClick={handleGetStarted}>
            Get Started
          </button>
        </div>

        <div style={styles.features}>
          <div style={styles.featureBox}>
            <h3 style={styles.featureTitle}>Scan Cards</h3>
            <p style={styles.featureText}>
              Quickly capture and identify cards for your collection.
            </p>
          </div>

          <div style={styles.featureBox}>
            <h3 style={styles.featureTitle}>Track Value</h3>
            <p style={styles.featureText}>
              Monitor pricing and understand what your collection is worth.
            </p>
          </div>

          <div style={styles.featureBox}>
            <h3 style={styles.featureTitle}>Stay Organized</h3>
            <p style={styles.featureText}>
              Keep your inventory searchable and easy to manage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    padding: '24px',
    color: '#ffffff',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '900px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
    backdropFilter: 'blur(8px)',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#cbd5e1',
    maxWidth: '640px',
    margin: '0 auto 32px auto',
    lineHeight: 1.6,
  },
  buttonRow: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '36px',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginTop: '12px',
  },
  featureBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'left',
  },
  featureTitle: {
    fontSize: '1.1rem',
    marginBottom: '8px',
    color: '#ffffff',
  },
  featureText: {
    fontSize: '0.95rem',
    color: '#cbd5e1',
    lineHeight: 1.5,
    margin: 0,
  },
};

export default Landing;