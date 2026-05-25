import React, { useState } from 'react';
import Gateway from './components/Gateway.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import CitizenPortal from './components/CitizenPortal.jsx';
import AnalystTerminal from './components/AnalystTerminal.jsx';
import ExecutiveDashboard from './components/ExecutiveDashboard.jsx';

const ROLE_LABELS = {
  citizen: 'Citizen Workspace',
  analyst: 'Forensic Terminal',
  executive: 'Executive Suite',
};

const ROLE_COLORS = {
  citizen: 'var(--accent)',
  analyst: 'var(--warn)',
  executive: 'var(--danger)',
};

export default function App() {
  const [role, setRole] = useState(null);       // null = gateway
  const [authDone, setAuthDone] = useState(false); // citizen auth gate
  const [user, setUser] = useState(null);

  const handleGateSelect = (selectedRole) => {
    if (selectedRole === 'citizen') {
      // Show login/signup first
      setRole('citizen_auth');
    } else {
      setRole(selectedRole);
    }
  };

  const handleAuth = (userData) => {
    if (userData === null) {
      // Back to gateway
      setRole(null);
      return;
    }
    setUser(userData);
    setAuthDone(true);
    setRole('citizen');
  };

  const handleExit = () => {
    setRole(null);
    setAuthDone(false);
    setUser(null);
  };

  // Gateway
  if (!role) return <Gateway onSelect={handleGateSelect} />;

  // Citizen Auth Screen
  if (role === 'citizen_auth') return <AuthScreen onAuth={handleAuth} />;

  // Main views
  const activeRole = role;

  return (
    <>
      <nav className="navbar">
        <div className="navbar__left">
          <button className="navbar__back" onClick={handleExit}>← Exit</button>
          <span className="navbar__logo" onClick={handleExit}>Aegis AI</span>
          <span className="navbar__sep">|</span>
          <span className="navbar__sub">{ROLE_LABELS[activeRole]}</span>
        </div>
        <div className="navbar__right">
          {user && <span className="navbar__name">{user.name || user.email}</span>}
          {!user && <span className="navbar__name">{ROLE_LABELS[activeRole]}</span>}
          <div className="navbar__avatar" style={{ background: ROLE_COLORS[activeRole] }}>
            {user ? user.name?.[0]?.toUpperCase() || 'C' : activeRole[0].toUpperCase()}
          </div>
        </div>
      </nav>

      <div className="view" key={activeRole}>
        {activeRole === 'citizen' && <CitizenPortal userName={user?.name} />}
        {activeRole === 'analyst' && <AnalystTerminal />}
        {activeRole === 'executive' && <ExecutiveDashboard />}
      </div>
    </>
  );
}
