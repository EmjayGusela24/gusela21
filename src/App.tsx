import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";

// --- Types ---
type Student = { id: string; name: string; password?: string; grade: string; has_voted: boolean };
type Candidate = { id: string; position: string; name: string; votes?: number; image_url?: string; campaign_text?: string };
type Admin = { name: string; id: string; isAdmin: boolean };
type User = Student | Admin;
type Page = "login" | "admin_setup" | "ballot" | "confirm" | "results" | "admin_voters";

const POSITIONS = [
  "President", "Vice President", "Secretary", "Treasurer", "PIO", "Sgt. At Arms",
  "Gr 7 Representative", "Gr 8 Representative", "Gr 9 Representative", 
  "Gr 10 Representative", "Gr 11 Representative", "Gr 12 Representative"
];

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

// --- Professional Footer Component ---
const Footer = () => {
  const [activeContent, setActiveContent] = useState<string | null>(null);
  const [showInitialPrivacy, setShowInitialPrivacy] = useState(() => !localStorage.getItem('privacyAccepted'));

  const handleAcceptPrivacy = () => {
    localStorage.setItem('privacyAccepted', 'true');
    setShowInitialPrivacy(false);
  };

  const legitPrivacyPolicy = (
    <>
      <p><em>Last Updated: {new Date().toLocaleDateString()}</em></p>
      <h4>1. Information We Collect</h4>
      <p>To facilitate secure student elections, we collect and process the following personally identifiable information (PII):</p>
      <ul>
        <li><strong>Identity Data:</strong> Legal name, Student Identification Number, and Institutional Email Address.</li>
        <li><strong>Eligibility Data:</strong> Current academic standing, major, and enrollment status to verify voting eligibility.</li>
        <li><strong>Technical Data:</strong> IP addresses, browser types, and access timestamps strictly for security and anti-fraud monitoring.</li>
      </ul>

      <h4>2. How We Use Your Information</h4>
      <p>Your data is used exclusively for the administration of the Student Government Association elections. Specifically, to:</p>
      <ul>
        <li>Authenticate your identity and prevent voter fraud.</li>
        <li>Ensure each eligible student casts only one ballot.</li>
        <li>Send automated election reminders and digital voting receipts.</li>
      </ul>

      <h4>3. Data Anonymization & Security</h4>
      <p>Our system employs end-to-end encryption. <strong>Your voting choices are permanently decoupled from your identity data upon submission.</strong> It is cryptographically impossible for system administrators, faculty, or candidates to associate your identity with the candidates you voted for.</p>

      <h4>4. Data Retention</h4>
      <p>Identity verification logs are maintained only until the election results are officially certified by the independent faculty committee. Once certified (typically within 14 days of the election's end), all voter correlation data and technical access logs are permanently purged from our servers.</p>

      <h4>5. Third-Party Sharing</h4>
      <p>We do not sell, rent, or share your personal data with any third parties, external organizations, or marketing entities under any circumstances.</p>
    </>
  );

  const modalContent = {
    help: {
      title: "Help Center & FAQ",
      body: (
        <>
          <h4>How do I cast my vote?</h4>
          <p>Navigate to the ballot page, select your preferred candidate, and click 'Securely Submit Vote'. You will receive a confirmation receipt.</p>
          <br/>
          <h4>I can't log in. What should I do?</h4>
          <p>Ensure you are using your correct 12-digit LRN and password. If you forgot your password, contact your school’s IT support or election committee.</p>
        </>
      )
    },
    about: {
      title: "About the Election Process",
      body: (
        <>
          <p>The Student Government Association (SGA) elections are held annually every Spring semester.</p>
          <ul>
            <li><strong>Nomination Phase:</strong> March 1st - March 15th</li>
            <li><strong>Campaigning Phase:</strong> March 16th - March 30th</li>
            <li><strong>Voting Period:</strong> April 1st - April 5th</li>
          </ul>
        </>
      )
    },
    rules: {
      title: "Official Voting Rules",
      body: (
        <ol>
          <li><strong>One Student, One Vote:</strong> Each verified student ID is permitted a single ballot submission.</li>
          <li><strong>No Coercion:</strong> Candidates may not stand over voters or force them to vote in a specific manner.</li>
          <li><strong>Technical Tampering:</strong> Any attempt to hack, bypass, or manipulate the electronic voting system will result in immediate disciplinary action.</li>
        </ol>
      )
    },
    privacy: {
      title: "Privacy & Data Policy",
      body: legitPrivacyPolicy
    },
    terms: {
      title: "Terms of Service",
      body: (
        <>
          <p>By accessing the Student Voting System, you agree to the following terms:</p>
          <p>1. You are an enrolled student at the institution.</p>
          <p>2. You will not share your login credentials with anyone else.</p>
          <p>3. You understand that ballot submissions are final and cannot be altered once confirmed.</p>
        </>
      )
    }
  };

  return (
    <>
      <style>
        {`
          .footer-wrapper {
            margin-top: auto;
            width: 100%;
            background-color: var(--primary-navy);
            color: #E2E8F0;
            font-family: 'Inter', sans-serif;
            border-top: 1px solid #1C2B4F;
          }

          .footer-top {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            padding: 48px 20px;
            gap: 40px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .footer-column { flex: 1; min-width: 200px; }
          .footer-column.wide { flex: 1.4; min-width: 260px; }
          .footer-heading { color: white; margin-bottom: 16px; font-size: 15px; font-weight: 600; letter-spacing: 0.02em; }
          .footer-list { display: flex; flex-direction: column; gap: 12px; font-size: 13px; }

          .contact-item { display: flex; align-items: flex-start; gap: 10px; color: #CBD5E1; line-height: 1.5; }
          .contact-icon { font-size: 20px; color: #94A3B8; margin-top: 2px; }

          .nav-link {
            color: #CBD5E1;
            text-decoration: none;
            background: none;
            border: none;
            padding: 0;
            font: inherit;
            text-align: left;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .nav-link:hover { color: white; }

          .help-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #60A5FA;
            font-size: 13px;
            font-weight: 500;
            padding: 8px 12px;
            border-radius: 6px;
            transition: all 0.2s ease;
            cursor: pointer;
            background: none;
            border: none;
          }
          .help-link:hover { background-color: rgba(96, 165, 250, 0.1); color: #93C5FD; }

          .footer-bottom {
            padding: 20px 20px;
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 12px;
            color: #94A3B8;
            border-top: 1px solid #1C2B4F;
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(11, 23, 54, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 200;
            padding: 20px;
          }

          .modal-container {
            background: white;
            color: var(--text-main);
            border-radius: 12px;
            width: 100%;
            max-width: 620px;
            max-height: 88vh;
            box-shadow: 0 20px 60px -10px rgba(0,0,0,0.25);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; }
          .modal-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
          .close-btn { background: none; border: none; font-size: 28px; color: #94A3B8; cursor: pointer; line-height: 1; }
          .close-btn:hover { color: #EF4444; }
          .modal-body { padding: 24px; overflow-y: auto; font-size: 14px; line-height: 1.6; }
          .modal-body h4 { margin: 24px 0 10px 0; font-size: 15px; font-weight: 600; color: var(--primary-navy); }
          .modal-body p, .modal-body li { color: var(--text-muted); }
          .modal-footer { padding: 20px 24px; border-top: 1px solid var(--border-light); background: var(--bg-gray); text-align: right; }

          @media (max-width: 768px) {
            .footer-top { padding: 40px 16px; gap: 32px; }
            .footer-bottom { flex-direction: column; align-items: flex-start; gap: 20px; }
          }
        `}
      </style>

      {/* Initial Privacy Pop-up */}
      {showInitialPrivacy && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Privacy & Data Protection</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: "#475467", marginBottom: "20px" }}>
                Welcome to the Student Voting System. Please review and accept our privacy policy before continuing.
              </p>
              {legitPrivacyPolicy}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleAcceptPrivacy}>
                I Understand and Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Content */}
      {activeContent && !showInitialPrivacy && (
        <div className="modal-overlay" onClick={() => setActiveContent(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalContent[activeContent].title}</h3>
              <button className="close-btn" onClick={() => setActiveContent(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {modalContent[activeContent].body}
            </div>
          </div>
        </div>
      )}

      <footer className="footer-wrapper">
        <div className="footer-top">
          <div className="footer-column">
            <h4 className="footer-heading">Contact Info</h4>
            <div className="footer-list">
              <div className="contact-item">
                <span className="material-symbols-outlined contact-icon">mail</span>
                <a href="mailto:electionscommittee@gmail.com?subject=Student%20Voting%20Inquiry" className="nav-link">
                  admin@gmail.com
                </a>
              </div>
              <div className="contact-item">
                <span className="material-symbols-outlined contact-icon">call</span>
                <span>09168562198</span>
              </div>
              <div className="contact-item">
                <span className="material-symbols-outlined contact-icon">location_on</span>
                <span>Student Affairs Office</span>
              </div>
            </div>
          </div>

          <div className="footer-column">
            <h4 className="footer-heading">Quick Links</h4>
            <div className="footer-list">
              <button onClick={() => setActiveContent('about')} className="nav-link">About Election Process</button>
              <button onClick={() => setActiveContent('rules')} className="nav-link">Official Voting Rules</button>
              <button onClick={() => setActiveContent('privacy')} className="nav-link">Privacy & Data Policy</button>
              <button onClick={() => setActiveContent('terms')} className="nav-link">Terms of Service</button>
            </div>
          </div>

          <div className="footer-column wide">
            <h4 className="footer-heading">Student Voting System</h4>
            <p style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#CBD5E1", marginBottom: "20px" }}>
              A secure, transparent, and fully encrypted electronic voting platform designed for fair student government elections.
            </p>
            <button onClick={() => setActiveContent('help')} className="help-link">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>help</span>
              Help Center & FAQ
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="copyright-text">
            <span style={{ color: "white", fontWeight: 500 }}>
              © {new Date().getFullYear()} Student Government Association
            </span>
            <span>All rights reserved. Unauthorized access is strictly prohibited.</span>
          </div>

          <div className="platform-badge">
            Built with Supabase
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#12B76A" }}>
              verified
            </span>
          </div>
        </div>
      </footer>
    </>
  );
};

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

    if (isLogin && identifier === "admin@gmail.com" && password === "admin123") {
      const adminUser: Admin = { name: "System Admin", id: "admin", isAdmin: true };
      localStorage.setItem("currentUser", JSON.stringify(adminUser));
      setCurrentUser(adminUser);
      setPage("admin_setup");
      return;
    }

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
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [candidateForm, setCandidateForm] = useState({ name: "", position: "President", image_url: "", campaign_text: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('position');
    if (data) setCandidates(data);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const saveCandidate = async () => {
    if (!candidateForm.name) return alert("Enter candidate name");
    setLoading(true);
    
    let finalImageUrl = candidateForm.image_url;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('candidate-photos')
        .upload(fileName, imageFile, { upsert: true });

      if (uploadError) {
        alert("Error uploading image: " + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('candidate-photos').getPublicUrl(fileName);
      finalImageUrl = urlData.publicUrl;
    }

    if (editingId) {
      const { error } = await supabase.from('candidates').update({ 
        name: candidateForm.name, 
        position: candidateForm.position,
        image_url: finalImageUrl,
        campaign_text: candidateForm.campaign_text
      }).eq('id', editingId);
      if (error) alert("Error updating: " + error.message);
      else alert("Candidate updated successfully.");
    } else {
      const { error } = await supabase.from('candidates').insert([{ 
        name: candidateForm.name, 
        position: candidateForm.position,
        image_url: finalImageUrl,
        campaign_text: candidateForm.campaign_text
      }]);
      if (error) alert("Error adding: " + error.message);
      else alert("Candidate added successfully.");
    }

    setCandidateForm({ name: "", position: "President", image_url: "", campaign_text: "" });
    setImageFile(null);
    setEditingId(null);
    const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    fetchCandidates();
    setLoading(false);
  };

  const editCandidate = (c: Candidate) => {
    setEditingId(c.id);
    setCandidateForm({
      name: c.name,
      position: c.position,
      image_url: c.image_url || "",
      campaign_text: c.campaign_text || ""
    });
    setImageFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCandidateForm({ name: "", position: "President", image_url: "", campaign_text: "" });
    setImageFile(null);
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
      
      <div className="status-card" style={{ marginBottom: "24px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined icon-box-light" style={{ width: "32px", height: "32px", fontSize: "18px" }}>{editingId ? "edit" : "person_add"}</span>
          {editingId ? "Edit Candidate" : "Add New Candidate"}
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input placeholder="Candidate Name" value={candidateForm.name} onChange={e => setCandidateForm({...candidateForm, name: e.target.value})} style={{ flex: 1, minWidth: "200px" }} />
            <select value={candidateForm.position} onChange={e => setCandidateForm({...candidateForm, position: e.target.value})} style={{ padding: "12px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "13px", minWidth: "200px" }}>
              {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Upload Candidate Photo</label>
            <input 
              id="photo-upload"
              type="file" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleFileChange}
              style={{ padding: "8px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "13px" }}
            />
            {candidateForm.image_url && !imageFile && (
               <span style={{ fontSize: "11px", color: "var(--primary-blue)" }}>Current image exists. Uploading a new one will replace it.</span>
            )}
          </div>

          <textarea 
            placeholder="Campaign Platform / Biography (Optional)" 
            value={candidateForm.campaign_text} 
            onChange={e => setCandidateForm({...candidateForm, campaign_text: e.target.value})}
            style={{ padding: "12px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "13px", minHeight: "80px", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-primary" onClick={saveCandidate} disabled={loading} style={{ width: "auto", padding: "12px 24px" }}>
              {loading ? "Saving..." : (editingId ? "Update Candidate" : "Save Candidate")}
            </button>
            {editingId && (
              <button className="btn-outline-wide" onClick={cancelEdit} style={{ width: "auto", padding: "12px 24px" }}>Cancel Edit</button>
            )}
          </div>
        </div>
      </div>

      <div className="card-box" style={{ background: "var(--bg-main)" }}>
        <h3>Current Candidates</h3>
        {candidates.length === 0 ? (
          <p className="mt-1" style={{ color: "var(--text-muted)", fontSize: "13px" }}>No candidates added yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
            {candidates.map(c => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid var(--border-light)", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img src={c.image_url || `https://ui-avatars.com/api/?name=${c.name}&background=E8F0FE&color=0B1736`} alt={c.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.position}</div>
                  </div>
                </div>
                <button className="btn-light-blue" onClick={() => editCandidate(c)} style={{ width: "auto", padding: "6px 12px", fontSize: "12px" }}>Edit</button>
              </div>
            ))}
          </div>
        )}
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

// --- Updated BallotPage with bigger boxes + tap-to-enlarge photo ---
const BallotPage: React.FC<{ setPage: (p: Page) => void; currentUser: Student }> = ({ setPage, currentUser }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null); // New: photo enlargement
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

    await supabase.from('students').update({ has_voted: true }).eq('id', currentUser.id);
    
    const updatedUser = { ...currentUser, has_voted: true };
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    
    setPage("confirm");
  };

  const toggleCampaign = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedCampaign(expandedCampaign === id ? null : id);
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
          <div 
            key={c.id} 
            onClick={() => setSelectedCandidate(c.id)} 
            className={`candidate-card ${selectedCandidate === c.id ? "selected" : ""}`}
          >
            {/* Bigger centered photo */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <img 
                src={c.image_url || `https://ui-avatars.com/api/?name=${c.name}&background=E8F0FE&color=0B1736`} 
                alt={c.name} 
                className="candidate-avatar"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent selecting the card when tapping photo
                  setEnlargedPhoto(c.image_url || `https://ui-avatars.com/api/?name=${c.name}&background=E8F0FE&color=0B1736`);
                }}
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <h3>{c.name}</h3>
              <span className="badge-dark-teal">{c.position}</span>
            </div>
            
            {c.campaign_text && (
              <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
                <button 
                  onClick={(e) => toggleCampaign(e, c.id)} 
                  style={{ background: "none", border: "none", color: "var(--primary-blue)", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", margin: "0 auto" }}
                >
                  {expandedCampaign === c.id ? "Hide Campaign" : "View Campaign Platform"}
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    {expandedCampaign === c.id ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {expandedCampaign === c.id && (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "12px", lineHeight: "1.6", textAlign: "center" }}>
                    {c.campaign_text}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="button-stack" style={{ marginTop: "32px" }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>Securely Submit Vote</button>
        <button className="btn-light-blue" onClick={() => setPage("results")}>View Live Results</button>
      </div>

      {/* Photo Enlargement Modal */}
      {enlargedPhoto && (
        <div className="modal-overlay" onClick={() => setEnlargedPhoto(null)}>
          <div 
            className="photo-modal" 
            onClick={e => e.stopPropagation()}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "20px",
              maxWidth: "90vw",
              maxHeight: "92vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)"
            }}
          >
            <button 
              className="close-btn" 
              onClick={() => setEnlargedPhoto(null)}
              style={{ 
                position: "absolute", 
                top: "15px", 
                right: "15px", 
                fontSize: "32px", 
                zIndex: 10,
                background: "none",
                border: "none",
                color: "#94A3B8"
              }}
            >
              &times;
            </button>
            <img 
              src={enlargedPhoto} 
              alt="Enlarged candidate photo" 
              style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "12px", objectFit: "contain" }}
            />
          </div>
        </div>
      )}
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
              <img src={r.candidate.image_url || `https://ui-avatars.com/api/?name=${r.candidate.name}&background=E8F0FE&color=0B1736`} alt={r.candidate.name} className="result-avatar" style={{ objectFit: "cover" }} />
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

      <Footer />
    </div>
  );
};

export default App;