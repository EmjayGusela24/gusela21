import React, { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase"; 
import "./App.css";

// --- Types ---
type Page = "login" | "elections" | "ballot" | "confirm" | "results";
type Election = { id: string; title: string; description: string; status: string };
type Candidate = { id: string; name: string; bio: string; party_affiliation: string; image_url: string };

// --- Constants ---
// Using the seeded election ID from the SQL schema
const CURRENT_ELECTION_ID = "e1000000-0000-0000-0000-000000000000";

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "elections", label: "Elections", icon: "how_to_vote" },
  { id: "ballot", label: "Ballot", icon: "fact_check" },
  { id: "confirm", label: "Confirm", icon: "verified" },
  { id: "results", label: "Results", icon: "bar_chart" }
];

// --- Shared UI Components ---
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

const AuthForm: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) return alert("Please enter email and password.");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Registration successful! You are now logged in.");
      }
      setPage("elections");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
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
            <input type="email" placeholder="Institutional Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleAuth} disabled={loading}>
            {loading ? "Processing..." : (isLogin ? "Authenticate" : "Register Credentials")}
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

const ElectionOverview: React.FC<{ setPage: (p: Page) => void; user: User | null }> = ({ setPage, user }) => {
  const [elections, setElections] = useState<Election[]>([]);

  useEffect(() => {
    const fetchElections = async () => {
      const { data, error } = await supabase.from("elections").select("*").eq("status", "active");
      if (!error && data) setElections(data);
    };
    fetchElections();
  }, []);

  return (
    <div className="screen-content">
      <div className="content-max-width">
        <span className="overline">Institutional Portal</span>
        <h1>Active Voting Terminal</h1>
        <p className="subtitle">
          Welcome, <strong>{user?.email || "Delegate"}</strong>. Your identity has been verified via hardware-encrypted protocols.
        </p>

        <div className="status-card">
          <span className="overline" style={{ color: "var(--text-light)" }}>System Status</span>
          <h2 style={{ marginTop: "4px" }}>Operational</h2>
          <div className="status-indicator">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified_user</span> Encrypted Tunnel Active
          </div>
        </div>

        <div className="flex-between" style={{ marginBottom: "16px", marginTop: "24px" }}>
          <h3>Available Elections</h3>
        </div>

        {elections.map((election) => (
          <div key={election.id} className="election-item">
            <div className="election-header">
              <div className="icon-box-light"><span className="material-symbols-outlined">account_balance</span></div>
              <div style={{ flex: 1 }}>
                <div className="flex-between">
                  <h3 style={{ lineHeight: 1.3, marginBottom: "4px" }}>{election.title}</h3>
                  <span className="badge-solid-teal">Active</span>
                </div>
                <p style={{ fontSize: "12px", marginTop: "4px" }}>{election.description}</p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setPage("ballot")} style={{ width: "fit-content", padding: "10px 20px" }}>
              Vote Now <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_forward</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const BallotPage: React.FC<{ setPage: (p: Page) => void; user: User | null; setHash: (h: string) => void }> = ({ setPage, user, setHash }) => {
  const [selected, setSelected] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      const { data, error } = await supabase.from("candidates").select("*").eq("election_id", CURRENT_ELECTION_ID);
      if (!error && data) setCandidates(data);
    };
    fetchCandidates();
  }, []);

  const handleVote = async () => {
    if (!selected || !user) return;
    setSubmitting(true);
    
    // Generate a mock cryptographic hash for the receipt
    const mockHash = crypto.randomUUID(); 

    const { error } = await supabase.from("votes").insert([{
      election_id: CURRENT_ELECTION_ID,
      candidate_id: selected,
      voter_id: user.id,
      cryptographic_hash: mockHash
    }]);

    setSubmitting(false);

    if (error) {
      if (error.code === '23505') alert("You have already cast a vote in this election.");
      else alert("Error casting vote: " + error.message);
    } else {
      setHash(mockHash);
      setPage("confirm");
    }
  };

  return (
    <div className="screen-content">
      <div className="content-max-width">
        <span className="overline">Official 2026 General Assembly</span>
        <h1>Digital Ballot</h1>
        <p className="subtitle">Please select one candidate. Your selection is cryptographically sealed once submitted.</p>

        <div className="candidate-grid">
          {candidates.map(c => (
            <div key={c.id} className={`candidate-card ${selected === c.id ? "selected" : ""}`} onClick={() => setSelected(c.id)}>
              <img src={c.image_url} alt={c.name} className="candidate-avatar" />
              <div className="candidate-info">
                <h3>{c.name}</h3>
                <p>{c.bio}</p>
                <div className="badge-dark-teal">{c.party_affiliation}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="confirm-box">
          <h3 style={{ marginBottom: "4px" }}>Confirm Selection</h3>
          <p className="subtitle" style={{ marginBottom: "16px", fontSize: "12px" }}>Submitting this ballot is final and cannot be undone.</p>
          <button className="btn-primary" disabled={!selected || submitting} onClick={handleVote}>
            {submitting ? "Encrypting Ballot..." : "Submit Vote"}
          </button>
        </div>
        <FooterLinks />
      </div>
    </div>
  );
};

const ResultsDashboard: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => {
  const [results, setResults] = useState<{ name: string; image_url: string; party: string; votes: number }[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      // 1. Fetch Candidates to map names to IDs
      const { data: candidatesData } = await supabase.from("candidates").select("*").eq("election_id", CURRENT_ELECTION_ID);
      
      // 2. Fetch Aggregated Results via RPC
      const { data: voteData, error } = await supabase.rpc("get_election_results", { p_election_id: CURRENT_ELECTION_ID });

      if (!error && voteData && candidatesData) {
        let total = 0;
        const mappedResults = candidatesData.map(c => {
          const voteRecord = voteData.find((v: any) => v.candidate_id === c.id);
          const votes = voteRecord ? Number(voteRecord.vote_count) : 0;
          total += votes;
          return { name: c.name, image_url: c.image_url, party: c.party_affiliation, votes };
        });

        // Sort by highest votes
        mappedResults.sort((a, b) => b.votes - a.votes);
        
        setTotalVotes(total);
        setResults(mappedResults);
      }
    };
    fetchResults();
  }, []);

  return (
    <div className="screen-content">
      <div className="content-max-width">
        <span className="overline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          LIVE ELECTION MONITOR <span className="live-dot"></span>
        </span>
        <h1>2026 Institutional Council</h1>
        
        <div className="flex-between results-toolbar">
          <div>
            <span className="overline" style={{ marginBottom: "4px" }}>Total Cast</span>
            <h3>{totalVotes} Votes Recorded</h3>
          </div>
          <button className="btn-outline-wide" onClick={() => setPage("elections")}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span> Return to List
          </button>
        </div>

        <div className="flex-between" style={{ marginBottom: "20px", marginTop: "24px" }}>
          <h2>Candidate Standings</h2>
        </div>

        <div className="results-list">
          {results.map((r, index) => {
            const percentage = totalVotes === 0 ? 0 : ((r.votes / totalVotes) * 100).toFixed(1);
            return (
              <div key={index} className="result-item">
                <img src={r.image_url} alt={r.name} className="result-avatar" />
                <div className="result-details" style={{ flex: 1 }}>
                  <div className="result-stats" style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div>
                      <h3>{r.name}</h3>
                      <span className="overline" style={{ marginBottom: 0 }}>{r.party}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <h3>{r.votes}</h3>
                      <p style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-main)" }}>{percentage}%</p>
                    </div>
                  </div>
                  <div className="result-bar-bg"><div className={`result-bar-fill ${index !== 0 ? 'gray-fill' : ''}`} style={{ width: `${percentage}%` }}></div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ConfirmationScreen: React.FC<{ setPage: (p: Page) => void; handleLogout: () => void; hash: string }> = ({ setPage, handleLogout, hash }) => (
  <div className="screen-content text-center flex-center">
    <div className="content-max-width" style={{ maxWidth: "400px" }}>
      <div className="success-icon-bg">
        <span className="material-symbols-outlined success-icon">verified</span>
      </div>
      <span className="overline">TRANSACTION COMPLETE</span>
      <h2 style={{ marginBottom: "12px" }}>Your vote has been cast successfully!</h2>
      <p className="subtitle">The Sovereign Ledger has permanently recorded your ballot.</p>

      <div className="audit-receipt text-left">
        <span className="material-symbols-outlined lock-icon">lock</span>
        <div className="audit-row">
          <label className="overline" style={{ marginBottom: "4px" }}>CRYPTOGRAPHIC HASH</label>
          <div className="value-box" style={{ fontSize: "10px" }}>
            {hash.split('-')[0]}...{hash.split('-')[4]} 
            <span className="material-symbols-outlined copy-icon" style={{ fontSize: "16px", cursor: "pointer" }}>content_copy</span>
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
  const [user, setUser] = useState<User | null>(null);
  const [receiptHash, setReceiptHash] = useState<string>("");

  // Check active session on load and listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) setPage("elections");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setPage("login");
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage("login");
  };

  return (
    <div className="app-container">
      {page !== "login" && <Header page={page} setPage={setPage} />}
      
      {page === "login" && <AuthForm setPage={setPage} />}
      {page === "elections" && <ElectionOverview setPage={setPage} user={user} />}
      {page === "ballot" && <BallotPage setPage={setPage} user={user} setHash={setReceiptHash} />}
      {page === "results" && <ResultsDashboard setPage={setPage} />}
      {page === "confirm" && <ConfirmationScreen setPage={setPage} handleLogout={handleLogout} hash={receiptHash} />}

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