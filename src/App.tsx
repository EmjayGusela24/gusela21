import React, { useState, useEffect } from "react";
import { supabase } from "./supabase"; // Make sure this path is correct
import "./App.css";

// --- Types ---
type Student = { id: string; name: string; password?: string; grade: string; has_voted: boolean };
type Candidate = { id: string; position: string; name: string; votes?: number };
type Admin = { name: string; id: string; isAdmin: boolean };
type User = Student | Admin;
type Page = "login" | "admin_setup" | "ballot" | "confirm" | "results" | "admin_voters";

// --- Shared UI Components ---
const Header = ({ currentUser, handleLogout }: { currentUser: User | null; handleLogout: () => void }) => (
  <header className="top-header">
    <div className="logo-area">
      <span className="material-symbols-outlined logo-icon">how_to_vote</span>
      <span className="logo-text">Student Voting System</span>
    </div>

    {currentUser && (
      <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="badge-light-blue">Logged in as: {currentUser.name}</div>
        <button onClick={handleLogout} className="btn-outline-wide" style={{ padding: "6px 12px", width: "auto" }}>
          Logout
        </button>
      </div>
    )}
  </header>
);

const ReturnButton = ({ onClick }: { onClick: () => void }) => (
  <button 
    className="btn-outline-wide" 
    onClick={onClick} 
    style={{ width: "auto", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
    Return
  </button>
);

// --- Main Screens ---

const AuthForm: React.FC<{ setPage: (p: Page) => void; setCurrentUser: (u: User) => void }> = ({ setPage, setCurrentUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ identifier: "", name: "", password: "", grade: "G7" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    const { identifier, name, password, grade } = form;

    // --- HIDDEN ADMIN LOGIN TRIGGER ---
    // If exact admin credentials are used during login, bypass standard validation
    if (isLogin && identifier === "admin@gmail.com" && password === "admin123") {
      const adminUser: Admin = { name: "System Admin", id: "admin", isAdmin: true };
      localStorage.setItem("currentUser", JSON.stringify(adminUser));
      setCurrentUser(adminUser);
      setPage("admin_setup");
      return;
    }

    // --- STANDARD VOTER VALIDATION ---
    const isValidVoterId = /^\d{12}$/.test(identifier);
    if (!isValidVoterId) {
      setError("LRN/Voter ID must be exactly 12 digits (numbers only).");
      return;
    }

    setLoading(true);

    if (!isLogin) {
      if (!name || !password) {
        setError("Please fill in all fields to register.");
        setLoading(false);
        return;
      }
      
      const { data: existing } = await supabase.from('students').select('id').eq('id', identifier).single();
      if (existing) {
        setError("This 12-digit LRN is already registered.");
        setLoading(false);
        return;
      }
      
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert([{ id: identifier, name, password, grade, has_voted: false }])
        .select()
        .single();
        
      if (insertError) {
        setError("Registration failed: " + insertError.message);
      } else if (newStudent) {
        localStorage.setItem("currentUser", JSON.stringify(newStudent));
        setCurrentUser(newStudent as Student);
        setPage("ballot");
      }
    } else {
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', identifier)
        .eq('password', password)
        .single();

      if (fetchError || !student) {
        setError("Invalid Voter Credentials. Please try again.");
      } else {
        localStorage.setItem("currentUser", JSON.stringify(student));
        setCurrentUser(student as Student);
        setPage(student.has_voted ? "results" : "ballot");
      }
    }
    setLoading(false);
  };

  return (
    <div className="screen-content flex-center">
      <div className="auth-wrapper card-box">
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <button className={isLogin ? "btn-light-blue" : "btn-outline-wide"} onClick={() => { setIsLogin(true); setError(""); }}>
            Login
          </button>
          <button className={!isLogin ? "btn-light-blue" : "btn-outline-wide"} onClick={() => { setIsLogin(false); setError(""); }}>
            Register
          </button>
        </div>

        <h2 className="text-center">{isLogin ? "Welcome Back" : "Create an Account"}</h2>
        <p className="text-center subtitle">Secure student election portal</p>
        
        {error && <div style={{ color: "#D92D20", background: "#FEF3F2", padding: "12px", borderRadius: "8px", fontSize: "12px", marginBottom: "16px", fontWeight: 600 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* The input visually only asks for LRN, but accepts the admin email silently */}
          <input name="identifier" placeholder="12-Digit LRN (Voter ID)" value={form.identifier} onChange={handleChange} />
          
          {!isLogin && (
            <>
              <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
              <select name="grade" value={form.grade} onChange={handleChange} style={{ padding: "12px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "13px" }}>
                <option value="G7">Grade 7</option>
                <option value="G8">Grade 8</option>
                <option value="G9">Grade 9</option>
                <option value="G10">Grade 10</option>
                <option value="G11">Grade 11</option>
                <option value="G12">Grade 12</option>
              </select>
            </>
          )}
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : (isLogin ? "Authenticate" : "Register Now")}
        </button>
      </div>
    </div>
  );
};

const AdminSetup: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => {
  const [candidateForm, setCandidateForm] = useState({ name: "", position: "President" });
  const [loading, setLoading] = useState(false);

  const addCandidate = async () => {
    if (!candidateForm.name) return alert("Enter candidate name");
    setLoading(true);
    
    const { error } = await supabase.from('candidates').insert([{ 
      name: candidateForm.name, 
      position: candidateForm.position 
    }]);

    if (error) {
      alert("Error adding candidate: " + error.message);
    } else {
      alert("Candidate defined successfully.");
      setCandidateForm({ name: "", position: "President" });
    }
    setLoading(false);
  };

  return (
    <div className="screen-content content-max-width">
      <div className="flex-between" style={{ marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Phase 1: Pre-Election Setup</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-outline-wide" onClick={() => setPage("admin_voters")} style={{ width: "auto", padding: "8px 16px" }}>Voter Audit</button>
          <button className="btn-light-blue" onClick={() => setPage("results")} style={{ width: "auto", padding: "8px 16px" }}>Live Results</button>
        </div>
      </div>
      
      <div className="status-card">
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined icon-box-light" style={{ width: "32px", height: "32px", fontSize: "18px" }}>person_add</span>
          Define Candidates
        </h2>
        <p className="mt-1 mb-3">Add candidates for specific election positions below.</p>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
          <input placeholder="Candidate Name" value={candidateForm.name} onChange={e => setCandidateForm({...candidateForm, name: e.target.value})} style={{ flex: 1, minWidth: "200px" }} />
          <select value={candidateForm.position} onChange={e => setCandidateForm({...candidateForm, position: e.target.value})} style={{ padding: "12px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "13px" }}>
            <option value="President">President</option>
            <option value="Vice President">Vice President</option>
            <option value="Secretary">Secretary</option>
            <option value="Treasurer">Treasurer</option>
          </select>
          <button className="btn-primary" onClick={addCandidate} disabled={loading} style={{ width: "auto", padding: "12px 24px" }}>
            {loading ? "Saving..." : "Save Candidate"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminVotersList: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data } = await supabase.from('students').select('*').order('name');
      if (data) setStudents(data);
      setLoading(false);
    };
    fetchStudents();
  }, []);
  
  return (
    <div className="screen-content content-max-width">
      <ReturnButton onClick={() => setPage("admin_setup")} />
      
      <div className="flex-between" style={{ marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="overline">Student Registry</span>
          <h1>Voter Audit Dashboard</h1>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-light-blue" onClick={() => setPage("results")} style={{ width: "auto", padding: "8px 16px" }}>Live Results</button>
        </div>
      </div>

      <div className="card-box" style={{ background: "var(--bg-main)", overflowX: "auto" }}>
        {loading ? (
          <p className="text-center" style={{ padding: "20px" }}>Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-center" style={{ padding: "20px" }}>No students have registered yet.</p>
        ) : (
          <table style={{ width: "100%", minWidth: "500px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Student Name</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>LRN (12-Digit ID)</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Grade/Section</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Voting Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "14px 8px", fontWeight: 600, color: "var(--text-main)" }}>{s.name}</td>
                  <td style={{ padding: "14px 8px", fontFamily: "monospace", color: "var(--text-muted)" }}>{s.id}</td>
                  <td style={{ padding: "14px 8px" }}>
                    <span className="badge-light-blue">{s.grade}</span>
                  </td>
                  <td style={{ padding: "14px 8px" }}>
                    {s.has_voted 
                      ? <span className="badge-solid-teal" style={{ background: "var(--accent-teal)" }}>VOTED</span> 
                      : <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>PENDING</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const BallotPage: React.FC<{ setPage: (p: Page) => void; currentUser: Student }> = ({ setPage, currentUser }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      const { data } = await supabase.from('candidates').select('*');
      if (data) setCandidates(data);
      setLoading(false);
    };
    fetchCandidates();
  }, []);

  const handleSubmit = async () => {
    if (!selectedCandidate) return setError("Validation Error: You must select a candidate before submitting.");
    setLoading(true);

    // 1. Insert Vote
    const { error: voteError } = await supabase.from('votes').insert([{ 
      student_id: currentUser.id, 
      candidate_id: selectedCandidate 
    }]);

    if (voteError) {
      if (voteError.code === '23505') {
        setError("You have already cast your vote in this election.");
      } else {
        setError("Error submitting vote: " + voteError.message);
      }
      setLoading(false);
      return;
    }

    // 2. Update Student Status
    await supabase.from('students').update({ has_voted: true }).eq('id', currentUser.id);
    
    // 3. Update Local Storage Session
    const updatedUser = { ...currentUser, has_voted: true };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    
    setPage("confirm");
  };

  if (loading) return <div className="screen-content flex-center">Loading ballot...</div>;

  return (
    <div className="screen-content content-max-width">
      <div style={{ marginBottom: "24px" }}>
        <span className="overline">Phase 2: Electronic Ballot</span>
        <h1>Official Voting Ballot</h1>
        <p>Welcome, <strong>{currentUser.name}</strong> ({currentUser.grade}). Please select your preferred candidate.</p>
      </div>

      {error && <div style={{ color: "#D92D20", background: "#FEF3F2", padding: "12px", borderRadius: "8px", fontSize: "12px", marginBottom: "24px", fontWeight: 600 }}>{error}</div>}

      <div className="candidate-grid">
        {candidates.length === 0 ? <p className="text-center" style={{ padding: "40px" }}>No candidates defined by Admin yet.</p> : null}
        
        {candidates.map(c => (
          <div key={c.id} onClick={() => setSelectedCandidate(c.id)} className={`candidate-card ${selectedCandidate === c.id ? "selected" : ""}`}>
            <img src={`https://ui-avatars.com/api/?name=${c.name}&background=E8F0FE&color=0B1736`} alt={c.name} className="candidate-avatar" />
            <div>
              <h3>{c.name}</h3>
              <span className="badge-dark-teal">{c.position}</span>
            </div>
            {selectedCandidate === c.id && <span className="material-symbols-outlined" style={{ marginLeft: "auto", color: "var(--primary-navy)" }}>check_circle</span>}
          </div>
        ))}
      </div>

      <div className="button-stack">
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>Securely Submit Vote</button>
        <button className="btn-light-blue" onClick={() => setPage("results")}>View Live Results</button>
      </div>
    </div>
  );
};

const ConfirmationScreen: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => (
  <div className="screen-content flex-center">
    <div className="confirm-box" style={{ maxWidth: "500px", width: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: "24px", left: "24px" }}>
        <ReturnButton onClick={() => setPage("results")} />
      </div>

      <div className="success-icon-bg" style={{ marginTop: "40px" }}>
        <span className="material-symbols-outlined success-icon">task_alt</span>
      </div>
      <h2>Vote Submitted Successfully!</h2>
      <p>Your encrypted ballot has been safely recorded.</p>
      
      <div className="audit-receipt text-left">
        <span className="material-symbols-outlined lock-icon">lock</span>
        <span className="overline">Electronic Vote Receipt</span>
        <p style={{ marginTop: "12px", marginBottom: "4px", fontSize: "11px" }}>Receipt ID:</p>
        <div className="value-box">
          {Math.random().toString(36).substr(2, 12).toUpperCase()}
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--text-light)" }}>tag</span>
        </div>
        <p style={{ marginTop: "12px", marginBottom: "4px", fontSize: "11px" }}>Timestamp:</p>
        <div className="value-box">
          {new Date().toLocaleString()}
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--text-light)" }}>schedule</span>
        </div>
      </div>

      <div className="button-stack">
        <button className="btn-light-blue" onClick={() => setPage("results")}>View Live Results</button>
      </div>
    </div>
  </div>
);

const ResultsDashboard: React.FC<{ currentUser: User | null; setPage: (p: Page) => void }> = ({ currentUser, setPage }) => {
  const [results, setResults] = useState<{ candidate: Candidate, count: number }[]>([]);
  const [stats, setStats] = useState({ totalRegistered: 0, totalVotesCast: 0 });

  useEffect(() => {
    const fetchResults = async () => {
      // Fetch all required data in parallel
      const [candidatesRes, votesRes, studentsRes] = await Promise.all([
        supabase.from('candidates').select('*'),
        supabase.from('votes').select('candidate_id'),
        supabase.from('students').select('id', { count: 'exact' })
      ]);

      const candidates = candidatesRes.data || [];
      const votes = votesRes.data || [];
      const totalRegistered = studentsRes.count || 0;

      const tally = candidates.map(c => ({
        candidate: c,
        count: votes.filter(v => v.candidate_id === c.id).length
      })).sort((a, b) => b.count - a.count);

      setResults(tally);
      setStats({
        totalRegistered,
        totalVotesCast: votes.length
      });
    };
    fetchResults();
  }, []);
  
  const turnoutPercent = stats.totalRegistered > 0 ? Math.round((stats.totalVotesCast / stats.totalRegistered) * 100) : 0;
  
  const isAdmin = currentUser && 'isAdmin' in currentUser && currentUser.isAdmin;
  const isStudentUnvoted = currentUser && 'has_voted' in currentUser && !currentUser.has_voted;

  return (
    <div className="screen-content content-max-width">
      <div className="flex-between" style={{ marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="overline">Current Happenings</span>
          <h1>Live Results Dashboard</h1>
          <div className="badge-cyan mt-1">
            <span className="live-dot"></span> Live Tabulation
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "8px" }}>
          {isAdmin && (
            <>
              <button className="btn-outline-wide" onClick={() => setPage("admin_voters")} style={{ width: "auto", padding: "8px 16px" }}>Voter Audit</button>
              <button className="btn-outline-wide" onClick={() => setPage("admin_setup")} style={{ width: "auto", padding: "8px 16px" }}>Back to Setup</button>
            </>
          )}
          {isStudentUnvoted && (
             <button className="btn-outline-wide" onClick={() => setPage("ballot")} style={{ width: "auto", padding: "8px 16px" }}>Back to Ballot</button>
          )}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-box dark-box relative-overflow">
          <span className="material-symbols-outlined watermark-icon">how_to_vote</span>
          <span className="overline" style={{ color: "rgba(255,255,255,0.7)" }}>Total Votes Cast</span>
          <h2 style={{ fontSize: "2rem", color: "white", margin: 0 }}>{stats.totalVotesCast}</h2>
        </div>
        <div className="stat-box light">
          <span className="overline">Voter Turnout</span>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>{turnoutPercent}%</h2>
          <p className="mt-1" style={{ fontSize: "11px" }}>{stats.totalVotesCast} of {stats.totalRegistered} registered voters</p>
        </div>
      </div>

      <div className="card-box" style={{ background: "var(--bg-main)" }}>
        <h3 style={{ marginBottom: "24px" }}>Candidate Standings</h3>

        {results.length === 0 && <p className="text-center">No data to display.</p>}
        
        {results.map((r, index) => {
          const percentage = stats.totalVotesCast > 0 ? Math.round((r.count / stats.totalVotesCast) * 100) : 0;
          const isWinner = index === 0 && r.count > 0;

          return (
            <div key={r.candidate.id} className="result-item">
              <img src={`https://ui-avatars.com/api/?name=${r.candidate.name}&background=E8F0FE&color=0B1736`} alt={r.candidate.name} className="result-avatar" />
              <div style={{ flex: 1 }}>
                <div className="flex-between" style={{ marginBottom: "8px" }}>
                  <div>
                    <strong>{r.candidate.name}</strong> <span className="badge-solid-teal" style={{ marginLeft: "8px" }}>{r.candidate.position}</span>
                  </div>
                  <strong style={{ fontSize: "16px" }}>{r.count}</strong>
                </div>
                <div className="result-bar-bg">
                  <div className={`result-bar-fill ${!isWinner ? "gray-fill" : ""}`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Main App Wrapper ---
const App: React.FC = () => {
  const [page, setPage] = useState<Page>("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        
        if ('isAdmin' in user && user.isAdmin) {
          setCurrentUser(user);
          setPage("admin_setup");
        } else {
          // Fetch latest student data to ensure has_voted is accurate
          const { data } = await supabase.from('students').select('*').eq('id', user.id).single();
          if (data) {
            setCurrentUser(data as Student);
            setPage(data.has_voted ? "results" : "ballot");
            localStorage.setItem("currentUser", JSON.stringify(data));
          } else {
            handleLogout();
          }
        }
      }
      setLoading(false);
    };
    initSession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setPage("login");
  };

  if (loading) return <div className="flex-center" style={{ height: "100vh" }}>Loading System...</div>;

  return (
    <div className="app-container">
      {page !== "login" && <Header currentUser={currentUser} handleLogout={handleLogout} />}
      
      {page === "login" && <AuthForm setPage={setPage} setCurrentUser={setCurrentUser} />}
      {page === "admin_setup" && <AdminSetup setPage={setPage} />}
      {page === "admin_voters" && <AdminVotersList setPage={setPage} />}
      {page === "ballot" && currentUser && !('isAdmin' in currentUser) && <BallotPage setPage={setPage} currentUser={currentUser as Student} />}
      {page === "confirm" && <ConfirmationScreen setPage={setPage} />}
      {page === "results" && <ResultsDashboard currentUser={currentUser} setPage={setPage} />}
    </div>
  );
};

export default App;