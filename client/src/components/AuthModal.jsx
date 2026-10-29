import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Phone, Calendar, Eye, EyeOff, Sparkles, LogOut, ArrowRight, MapPin, Building, Home, Briefcase } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'profile'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Personal Info State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('2002-05-14');

  // Sign Up Address Columns State (written to ADDRESS relation)
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressType, setAddressType] = useState('HOME');

  useEffect(() => {
    if (currentUser) {
      setMode('profile');
    } else {
      setMode('signin');
    }
    setErrorMsg('');
    setSuccessMsg('');
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Sign In Submit
  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setSuccessMsg(data.message);
        onLoginSuccess(data.data);
        setTimeout(() => onClose(), 600);
      } else {
        setErrorMsg(data.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Network error connecting to authentication service.');
    }
  };

  // Handle Sign Up Submit with Address
  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!street.trim() || !city.trim() || !postalCode.trim()) {
      setErrorMsg('Please provide your complete delivery address (Street, City, Postal Code).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/customers/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: signupEmail,
          password: signupPassword,
          phone,
          dateOfBirth,
          street: street.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          addressType
        })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setSuccessMsg(data.message);
        onLoginSuccess(data.data);
        setTimeout(() => onClose(), 800);
      } else {
        setErrorMsg(data.message || 'Failed to create account.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('Network error while creating account.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1400 }}>
      <div className="modal-content" style={{ maxWidth: '520px', padding: '2.2rem 2rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fc5200', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.8rem', boxShadow: '0 4px 14px rgba(252, 82, 0, 0.35)' }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: '800', color: '#1e1e24' }}>
            {mode === 'profile' ? 'My Customer Profile' : 'Welcome to FoodieGo'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#686b78', marginTop: '0.2rem' }}>
            {mode === 'signin' && 'Sign in with your email and password'}
            {mode === 'signup' && 'Create your customer account with your delivery address'}
            {mode === 'profile' && 'Manage your account details and loyalty rewards'}
          </p>
        </div>

        {/* Success / Error alerts */}
        {errorMsg && <div className="auth-error-alert">{errorMsg}</div>}
        {successMsg && <div className="auth-success-alert">{successMsg}</div>}

        {/* Mode Tabs (Sign In vs Create Account) */}
        {mode !== 'profile' && (
          <div className="auth-tabs-nav">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => { setMode('signin'); setErrorMsg(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setErrorMsg(''); }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 1: SIGN IN FORM
        ------------------------------------------------------------- */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn}>
            <div className="auth-form-group">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={17} className="auth-input-icon" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={17} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-checkout"
              style={{ justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}
            >
              <span>{loading ? 'Signing In...' : 'Sign In to FoodieGo'}</span>
              <ArrowRight size={18} />
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.4rem', fontSize: '0.88rem', color: '#686b78' }}>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{ color: '#fc5200', fontWeight: '800' }}
              >
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* -------------------------------------------------------------
            TAB 2: CREATE ACCOUNT (With Full Address Section)
        ------------------------------------------------------------- */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp}>
            {/* Section 1: Personal Credentials (PERSON relation) */}
            <div style={{ marginBottom: '1.2rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#fc5200', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                1. Personal Information (PERSON)
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.5rem' }}>
                <div className="auth-form-group">
                  <label className="auth-label">First Name</label>
                  <div className="auth-input-wrapper">
                    <User size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Rishi"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Last Name</label>
                  <div className="auth-input-wrapper">
                    <User size={16} className="auth-input-icon" />
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Kumar"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="rishi@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.8rem' }}>
                <div className="auth-form-group">
                  <label className="auth-label">Phone (PERSON_PHONE)</label>
                  <div className="auth-input-wrapper">
                    <Phone size={16} className="auth-input-icon" />
                    <input
                      type="tel"
                      className="auth-input"
                      placeholder="+91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label" title="Used in VW_CUSTOMER_AGE view">Date of Birth</label>
                  <div className="auth-input-wrapper">
                    <Calendar size={16} className="auth-input-icon" />
                    <input
                      type="date"
                      className="auth-input"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Create a strong password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={4}
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Address Information (ADDRESS relation) */}
            <div style={{ background: '#f8f9fa', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
                <MapPin size={17} color="#fc5200" />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e1e24' }}>
                  Delivery Address (Stored in ADDRESS relation)
                </span>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Street / Flat / House / Landmark</label>
                <div className="auth-input-wrapper">
                  <Building size={16} className="auth-input-icon" />
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Flat 301, Lakeview Apts, 100ft Road"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="auth-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="auth-label">City</label>
                    <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.2rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCity('Chennai');
                          setState('Tamil Nadu');
                          if (!postalCode) setPostalCode('600040');
                        }}
                        style={{ fontSize: '0.72rem', background: city.toLowerCase() === 'chennai' ? '#fc5200' : '#f1f3f5', color: city.toLowerCase() === 'chennai' ? '#fff' : '#4b5563', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '700' }}
                      >
                        Chennai
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCity('Bangalore');
                          setState('Karnataka');
                          if (!postalCode) setPostalCode('560038');
                        }}
                        style={{ fontSize: '0.72rem', background: city.toLowerCase() === 'bangalore' ? '#fc5200' : '#f1f3f5', color: city.toLowerCase() === 'bangalore' ? '#fff' : '#4b5563', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '700' }}
                      >
                        Bangalore
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="e.g. Chennai, Bangalore"
                    value={city}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCity(val);
                      if (/chennai/i.test(val)) {
                        setState('Tamil Nadu');
                        if (!postalCode) setPostalCode('600040');
                      } else if (/bangalore|bengaluru/i.test(val)) {
                        setState('Karnataka');
                        if (!postalCode) setPostalCode('560038');
                      }
                    }}
                    required
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">State</label>
                  <input
                    type="text"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="e.g. Tamil Nadu, Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div className="auth-form-group">
                  <label className="auth-label">Postal / PIN Code</label>
                  <input
                    type="text"
                    className="auth-input"
                    style={{ paddingLeft: '1rem' }}
                    placeholder="e.g. 600040 or 560038"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Address Type</label>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    {['HOME', 'WORK', 'OTHER'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddressType(type)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.2rem',
                          borderRadius: '6px',
                          border: `1.5px solid ${addressType === type ? '#fc5200' : '#d1d5db'}`,
                          background: addressType === type ? '#fff2eb' : '#ffffff',
                          color: addressType === type ? '#fc5200' : '#4b5563',
                          fontSize: '0.75rem',
                          fontWeight: '800'
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-checkout"
              style={{ justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}
            >
              <span>{loading ? 'Creating Account...' : 'Create Account & Save Address'}</span>
              <Sparkles size={18} />
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.85rem', color: '#686b78' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                style={{ color: '#fc5200', fontWeight: '800' }}
              >
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* -------------------------------------------------------------
            TAB 3: LOGGED IN PROFILE VIEW
        ------------------------------------------------------------- */}
        {mode === 'profile' && currentUser && (
          <div>
            <div style={{ background: '#f8f9fa', borderRadius: '14px', padding: '1.2rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e1e24' }}>
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <span style={{ background: '#ecfdf5', color: '#065f46', fontSize: '0.78rem', fontWeight: '800', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                  ID: {currentUser.personId || currentUser.Person_ID}
                </span>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#4b5563', marginBottom: '0.3rem' }}>
                <strong>Email:</strong> {currentUser.email}
              </p>
              {currentUser.phone && (
                <p style={{ fontSize: '0.88rem', color: '#4b5563', marginBottom: '0.6rem' }}>
                  <strong>Phone:</strong> {currentUser.phone}
                </p>
              )}

              {/* Saved Addresses from database */}
              {currentUser.addresses && currentUser.addresses.length > 0 && (
                <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px dashed #d1d5db' }}>
                  <strong style={{ fontSize: '0.82rem', color: '#1e1e24', display: 'block', marginBottom: '0.3rem' }}>
                    Saved Delivery Address (ADDRESS table):
                  </strong>
                  <p style={{ fontSize: '0.85rem', color: '#686b78' }}>
                    {currentUser.addresses[0].Street}, {currentUser.addresses[0].City} - {currentUser.addresses[0].Postal_Code}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                type="button"
                onClick={() => { setMode('signin'); }}
                style={{
                  flex: 1,
                  background: '#f1f3f5',
                  color: '#1e1e24',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.9rem'
                }}
              >
                Switch Account
              </button>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMode('signin');
                }}
                style={{
                  flex: 1,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
