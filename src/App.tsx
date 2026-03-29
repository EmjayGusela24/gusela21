import React, { useState, useEffect } from "react";
import "./App.css";

// --- Types ---
type User = { name: string; email: string; id: string; password: string };
type Page = "login" | "elections" | "ballot" | "confirm" | "results";

// --- Shared UI Components ---
const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "elections", label: "Elections", icon: "how_to_vote" },
  { id: "ballot", label: "Ballot", icon: "fact_check" },
  { id: "confirm", label: "Confirm", icon: "verified" },
  { id: "results", label: "Results", icon: "bar_chart" }
];

const Header = ({ page, setPage }: { page: Page; setPage: (p: Page) => void }) => (
  <header className="top-header">
    <div className="logo-area">
      <span className="material-symbols-outlined logo-icon">account_balance</span>
      <span className="logo-text">The Sovereign Ledger</span>
    </div>

    {page !== "login" && (
      <div className="desktop-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`desktop-nav-item ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            <span className="material-symbols-outlined nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    )}

    {page !== "login" && (
      <div className="header-right">
        <div className="badge-light-blue">Signed In</div>
      </div>
    )}
  </header>
);

const FooterLinks = () => (
  <div className="footer-links">
    <div className="footer-brand">
      <span style={{ fontWeight: 700, color: "var(--primary-navy)" }}>The Sovereign Ledger</span>
      <span style={{ color: "var(--text-light)", marginLeft: "8px" }}>© 2026 Secure Institutional Voting</span>
    </div>
    <div className="footer-nav">
      <span>Support</span>
      <span>Legal</span>
      <span>Privacy</span>
      <span>Audit Logs</span>
    </div>
  </div>
);

// --- Main Screens ---

const AuthForm: React.FC<{ setPage: (p: Page) => void; setCurrentUser: (u: User) => void }> = ({ setPage, setCurrentUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ id: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", id: "", password: "" });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });

  const handleRegister = () => {
    const { name, email, id, password } = registerForm;
    if (!name || !email || !id || !password) return alert("Please fill out all four fields.");

    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.find(u => u.id === id)) return alert("This Institutional ID is already registered.");

    users.push({ name, email, id, password });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Registration successful! Please log in.");
    setRegisterForm({ name: "", email: "", id: "", password: "" });
    setIsLogin(true);
  };

  const handleLogin = () => {
    const { id, password } = loginForm;
    if (!id || !password) return alert("Enter your ID and password.");

    if (id === "admin" && password === "admin") {
      const adminUser = { name: "System Admin", email: "admin@ledger.org", id: "admin", password: "admin" };
      localStorage.setItem("currentUser", JSON.stringify(adminUser));
      setCurrentUser(adminUser);
      setPage("elections");
      return;
    }

    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]");
    const user = users.find(u => u.id === id && u.password === password);
    if (!user) return alert("Invalid credentials or user not found. Please register first.");

    localStorage.setItem("currentUser", JSON.stringify(user));
    setCurrentUser(user);
    setPage("elections");
  };

  return (
    <div className="screen-content flex-center">
      <div className="auth-wrapper">
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary-navy)' }}>account_balance</span>
          <h1 style={{ marginTop: '16px' }}>The Sovereign Ledger</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Secure Institutional Access System</p>
        </div>

        <div className="card-box">
          <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
            {isLogin ? "Institutional Login" : "Register Access"}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {!isLogin && (
              <>
                <input name="name" placeholder="Full Name" value={registerForm.name} onChange={handleRegisterChange} />
                <input name="email" type="email" placeholder="Email" value={registerForm.email} onChange={handleRegisterChange} />
              </>
            )}
            <input name="id" placeholder="Institutional ID (e.g., admin)" value={isLogin ? loginForm.id : registerForm.id} onChange={isLogin ? handleLoginChange : handleRegisterChange} />
            <input name="password" type="password" placeholder="Password (e.g., admin)" value={isLogin ? loginForm.password : registerForm.password} onChange={isLogin ? handleLoginChange : handleRegisterChange} />
          </div>
          <button className="btn-primary" onClick={isLogin ? handleLogin : handleRegister}>
            {isLogin ? "Authenticate" : "Register Credentials"}
          </button>
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
            {isLogin ? "No account?" : "Already have one?"}
            <span onClick={() => setIsLogin(!isLogin)} className="link-text"> {isLogin ? "Register here" : "Login here"}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

const ElectionOverview: React.FC<{ setPage: (p: Page) => void; currentUser: User | null }> = ({ setPage, currentUser }) => (
  <div className="screen-content">
    <div className="content-max-width">
      <span className="overline">Institutional Portal</span>
      <h1>Active Voting Terminal</h1>
      <p className="subtitle">
        Welcome, <strong>{currentUser?.name || "Delegate"}</strong>. Your identity has been verified via hardware-encrypted protocols. Select an active election to cast your immutable ballot.
      </p>

      <div className="status-card">
        <span className="overline" style={{ color: "var(--text-light)" }}>System Status</span>
        <h2 style={{ marginTop: "4px" }}>Operational</h2>
        <div className="status-indicator">
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified_user</span> Encrypted Tunnel Active
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-box dark-box relative-overflow">
          <span className="overline" style={{ color: "#D1E0FF", marginBottom: 0 }}>Open Ballots</span>
          <h2 style={{ fontSize: "28px", margin: "8px 0" }}>03</h2>
          <span className="material-symbols-outlined watermark-icon">how_to_vote</span>
        </div>
        <div className="stat-box light">
          <span className="overline" style={{ marginBottom: 0 }}>Last Audit</span>
          <h3 style={{ margin: "8px 0" }}>Mar 29, 08:32 UTC</h3>
          <span className="hash-text">Hash: 8f2a...e921</span>
        </div>
      </div>

      <div className="flex-between" style={{ marginBottom: "16px", marginTop: "24px" }}>
        <h3>Available Elections</h3>
        <span className="material-symbols-outlined icon-button" style={{ cursor: "pointer", color: "var(--text-muted)" }}>filter_list</span>
      </div>

      <div className="election-item">
        <div className="election-header">
          <div className="icon-box-light"><span className="material-symbols-outlined">account_balance</span></div>
          <div style={{ flex: 1 }}>
            <div className="flex-between">
              <h3 style={{ lineHeight: 1.3, marginBottom: "4px" }}>2026 Federal General Assembly</h3>
              <span className="badge-solid-teal">Active</span>
            </div>
            <p style={{ fontSize: "12px", marginTop: "4px" }}>Decides the executive council composition for the 2026–2030 term.</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setPage("ballot")} style={{ width: "fit-content", padding: "10px 20px" }}>
          Vote Now <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_forward</span>
        </button>
      </div>
    </div>
  </div>
);

const BallotPage: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => {
  const [selected, setSelected] = useState<string>("");

  const candidates = [
    { id: "vance", name: "Julian Vance", bio: "Former Economic Counsel with 15 years in fiscal policy and systemic oversight.", img: "https://i.pravatar.cc/100?img=11" },
    { id: "sterling", name: "Elena Sterling", bio: "Specialist in decentralized governance structures and institutional transparency.", img: "https://i.pravatar.cc/100?img=5" },
    { id: "thorne", name: "Marcus Thorne", bio: "Human Rights advocate focusing on digital privacy and sovereign data rights.", img: "https://i.pravatar.cc/100?img=12" }
  ];

  return (
    <div className="screen-content">
      <div className="content-max-width">
        <span className="overline">Official 2026 General Assembly</span>
        <h1>Digital Ballot</h1>
        <p className="subtitle">Please select one candidate for the Chief Arbiter position. Your selection is cryptographically sealed once submitted.</p>

        <div className="candidate-grid">
          {candidates.map(c => (
            <div key={c.id} className={`candidate-card ${selected === c.id ? "selected" : ""}`} onClick={() => setSelected(c.id)}>
              <img src={c.img} alt={c.name} className="candidate-avatar" />
              <div className="candidate-info">
                <h3>{c.name}</h3>
                <p>{c.bio}</p>
                <div className="badge-dark-teal">Verified Independent</div>
              </div>
            </div>
          ))}
        </div>

        <div className="confirm-box">
          <h3 style={{ marginBottom: "4px" }}>Confirm Selection</h3>
          <p className="subtitle" style={{ marginBottom: "16px", fontSize: "12px" }}>Submitting this ballot is final and cannot be undone.</p>
          <button className="btn-primary" disabled={!selected} onClick={() => setPage("confirm")}>Submit Vote</button>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
};

const ResultsDashboard: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => (
  <div className="screen-content">
    <div className="content-max-width">
      <span className="overline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        LIVE ELECTION MONITOR <span className="live-dot"></span>
      </span>
      <h1>2026 Institutional Council</h1>
      
      <div className="flex-between results-toolbar">
        <div>
          <span className="overline" style={{ marginBottom: "4px" }}>Last Updated</span>
          <h3>March 29, 2026 — 14:32:01 PST</h3>
        </div>
        <button className="btn-outline-wide" onClick={() => setPage("elections")}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span> Return to List
        </button>
      </div>

      <div className="stat-box dark-box" style={{ marginBottom: "32px", padding: "24px" }}>
        <span className="overline" style={{ color: "#D1E0FF" }}>VOTER TURNOUT</span>
        <h2 style={{ fontSize: "40px", marginTop: "8px", marginBottom: "16px" }}>84.2%</h2>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", marginBottom: "16px" }}></div>
        <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600 }}>12,439 of 14,782 eligible votes cast</p>
      </div>

      <div className="flex-between" style={{ marginBottom: "20px" }}>
        <h2>Candidate Standings</h2>
        <span className="badge-cyan">
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>verified</span> Verified
        </span>
      </div>

      <div className="results-list">
        <div className="result-item">
          <img src="https://i.pravatar.cc/100?img=11" alt="Vance" className="result-avatar" />
          <div className="result-details" style={{ flex: 1 }}>
            <div className="result-stats" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <h3>Julian Vance</h3>
                <span className="overline" style={{ marginBottom: 0 }}>PROGRESSIVE BLOC</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <h3>5,244</h3>
                <p style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-main)" }}>42.2%</p>
              </div>
            </div>
            <div className="result-bar-bg"><div className="result-bar-fill" style={{ width: "42.2%" }}></div></div>
          </div>
        </div>
        
        <div className="result-item">
          <img src="https://i.pravatar.cc/100?img=5" alt="Sterling" className="result-avatar" />
          <div className="result-details" style={{ flex: 1 }}>
            <div className="result-stats" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <h3>Elena Sterling</h3>
                <span className="overline" style={{ marginBottom: 0 }}>STABILITY ALLIANCE</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <h3>4,812</h3>
                <p style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-main)" }}>38.8%</p>
              </div>
            </div>
            <div className="result-bar-bg"><div className="result-bar-fill gray-fill" style={{ width: "38.8%" }}></div></div>
          </div>
        </div>
      </div>

      <div className="hash-box-footer" style={{ display: "flex", gap: "12px", background: "var(--bg-gray)", padding: "16px", borderRadius: "8px", marginTop: "32px", border: "1px solid var(--border-light)" }}>
        <span className="material-symbols-outlined" style={{ color: "var(--text-main)" }}>security</span>
        <div>
          <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-main)" }}>Cryptographic Integrity Hash</h4>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", wordBreak: "break-all" }}>SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
        </div>
      </div>
    </div>
  </div>
);

const ConfirmationScreen: React.FC<{ setPage: (p: Page) => void; handleLogout: () => void }> = ({ setPage, handleLogout }) => (
  <div className="screen-content text-center flex-center">
    <div className="content-max-width" style={{ maxWidth: "400px" }}>
      <div className="success-icon-bg">
        <span className="material-symbols-outlined success-icon">verified</span>
      </div>
      <span className="overline">TRANSACTION COMPLETE</span>
      <h2 style={{ marginBottom: "12px" }}>Your vote has been cast successfully!</h2>
      <p className="subtitle">The Sovereign Ledger has permanently recorded your ballot. Your cryptographic signature ensures your choice remains immutable.</p>

      <div className="audit-receipt text-left">
        <span className="material-symbols-outlined lock-icon">lock</span>
        <div className="audit-row">
          <label className="overline" style={{ marginBottom: "4px" }}>CONFIRMATION ID</label>
          <div className="value-box">
            SL-8842-XN9B-LE7K <span className="material-symbols-outlined copy-icon" style={{ fontSize: "16px", cursor: "pointer" }}>content_copy</span>
          </div>
        </div>
        <div className="flex-between mt-4">
          <div className="audit-row">
            <label className="overline" style={{ marginBottom: "4px" }}>TIMESTAMP</label>
            <div style={{ fontSize: "12px", fontWeight: 600 }}>Mar 29, 2026</div>
          </div>
          <div className="audit-row text-right">
            <label className="overline" style={{ marginBottom: "4px" }}>STATUS</label>
            <div className="badge-cyan mt-1" style={{ fontSize: "10px", padding: "4px 8px" }}>VERIFIED</div>
          </div>
        </div>
      </div>

      <div className="button-stack">
        <button className="btn-primary" onClick={() => setPage("results")}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>receipt_long</span> View Live Results
        </button>
        <button className="btn-outline-wide" onClick={handleLogout}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>logout</span> Secure Logout
        </button>
      </div>
    </div>
  </div>
);

// --- Main App Wrapper ---
const App: React.FC = () => {
  const [page, setPage] = useState<Page>("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setPage("elections");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setPage("login");
  };

  return (
    <div className="app-container">
      {page !== "login" && <Header page={page} setPage={setPage} />}
      
      {page === "login" && <AuthForm setPage={setPage} setCurrentUser={setCurrentUser} />}
      {page === "elections" && <ElectionOverview setPage={setPage} currentUser={currentUser} />}
      {page === "ballot" && <BallotPage setPage={setPage} />}
      {page === "results" && <ResultsDashboard setPage={setPage} />}
      {page === "confirm" && <ConfirmationScreen setPage={setPage} handleLogout={handleLogout} />}

      {/* Mobile Bottom Navigation */}
      {page !== "login" && (
        <nav className="bottom-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
              <span className="material-symbols-outlined bottom-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default App;