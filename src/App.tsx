import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";
// =====================================================
// STUDENT VOTING SYSTEM - COMPLETE FULL CODE (Fixed)
// Total lines: 1550+
// Footer updated with your new bright solid version
// =====================================================

// --- Types ---
type Student = {
  id: string;
  name: string;
  password?: string;
  grade: string;
  has_voted: boolean;
  photo_url?: string;
};
type Candidate = {
  id: string;
  position: string;
  name: string;
  votes?: number;
  image_url?: string;
  campaign_text?: string;
};
type Admin = { name: string; id: string; isAdmin: boolean };
type User = Student | Admin;
type Page = "login" | "admin_setup" | "ballot" | "confirm" | "results" | "admin_voters" | "student_profile" | "candidate_profile" | "print_results" | "my_receipt";

const POSITIONS = [
  "President", "Vice President", "Secretary", "Treasurer", "PIO", "Sgt. At Arms",
  "Gr 7 Representative", "Gr 8 Representative", "Gr 9 Representative",
  "Gr 10 Representative", "Gr 11 Representative", "Gr 12 Representative"
];

// ==================== PHOTO VIEWER ====================
const PhotoViewerModal: React.FC<{
  imageUrl: string;
  onClose: () => void;
}> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const resetView = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.3 : -0.3;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300, backgroundColor: "rgba(15, 23, 42, 0.95)" }}>
      <div className="photo-modal" onClick={e => e.stopPropagation()} style={{ zIndex: 301 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={zoomOut} className="btn-outline-wide">− Zoom</button>
            <button onClick={resetView} className="btn-outline-wide">Reset</button>
            <button onClick={zoomIn} className="btn-outline-wide">+ Zoom</button>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f5f9",
            borderRadius: "12px",
            cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onWheel={handleWheel}
        >
          <img
            src={imageUrl}
            alt="Zoomable view"
            draggable={false}
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? "none" : "transform 0.2s ease",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
            }}
          />
        </div>
        <p style={{ textAlign: "center", marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
          Scroll to zoom • Drag to pan
        </p>
      </div>
    </div>
  );
};

// --- Header ---
const Header = ({ currentUser, handleLogout }: { currentUser: User | null; handleLogout: () => void }) => (
  <header className="top-header">
    <div className="logo-area">
      <span className="material-symbols-outlined logo-icon">how_to_vote</span>
      <span className="logo-text">Student Voting System</span>
    </div>
    {currentUser && (
      <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ background: "#E0F2FE", color: "#0C4A6E", padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, border: "1px solid #BAE6FD", display: "flex", alignItems: "center", gap: "6px" }}>
          Logged in as: {currentUser.name}
        </div>
        <button onClick={handleLogout} className="btn-outline-wide" style={{ padding: "6px 16px", width: "auto", borderRadius: "9999px" }}>Logout</button>
      </div>
    )}
  </header>
);

const ReturnButton = ({ onClick }: { onClick: () => void }) => (
  <button className="btn-outline-wide" onClick={onClick} style={{ width: "auto", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span> Return
  </button>
);

// --- YOUR NEW BRIGHT SOLID FOOTER ---
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
        <li><strong>Identity Data:</strong> Legal name, Student Identification Number (LRN), and Institutional Email Address.</li>
        <li><strong>Eligibility Data:</strong> Current academic standing, grade, and enrollment status to verify voting eligibility.</li>
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
      <p>Identity verification logs are maintained only until the election results are officially certified. Once certified, all voter correlation data is permanently purged.</p>
      <h4>5. Third-Party Sharing</h4>
      <p>We do not sell, rent, or share your personal data with any third parties.</p>
    </>
  );

  const modalContent: Record<string, { title: string; body: React.ReactNode }> = {
    help: {
      title: "Help Center & FAQ",
      body: (
        <>
          <h4>How do I cast my vote?</h4>
          <p>Navigate to the ballot page, select your preferred candidate for each position, and click 'Securely Submit Vote'. You will receive a confirmation receipt.</p>
          <br/>
          <h4>I can't log in. What should I do?</h4>
          <p>Ensure you are using your correct 12-digit LRN and password. If you forgot your password, contact your school's IT support or election committee.</p>
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
          <li><strong>One Student, One Vote per Position:</strong> Each verified student ID is permitted exactly one vote per representative position.</li>
          <li><strong>No Coercion:</strong> Candidates may not stand over voters or force them to vote in a specific manner.</li>
          <li><strong>Technical Tampering:</strong> Any attempt to hack, bypass, or manipulate the electronic voting system will result in immediate disciplinary action.</li>
        </ol>
      )
    },
    privacy: { title: "Privacy & Data Policy", body: legitPrivacyPolicy },
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
          .app-container { min-height: 100vh; display: flex; flex-direction: column; }
          .footer-wrapper {
            margin-top: auto;
            width: 100%;
            background-color: #0F172A; /* Solid bright navy - NO transparency */
            color: #F1F5F9;
            font-family: 'Inter', sans-serif;
            border-top: 1px solid #334155;
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
          .footer-heading {
            color: #F8FAFC;
            margin-bottom: 16px;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.02em;
          }
          .footer-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            font-size: 13.5px;
          }
          .contact-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            color: #E2E8F0;
            line-height: 1.5;
          }
          .contact-icon {
            font-size: 20px;
            color: #94A3B8;
            margin-top: 2px;
          }
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
          .nav-link:hover { color: #F1F5F9; }
          .supported-by {
            margin-top: 20px;
            font-size: 13.5px;
            color: #CBD5E1;
            line-height: 1.6;
          }
          .supported-by a {
            color: #60A5FA;
            text-decoration: none;
            transition: color 0.2s ease;
          }
          .supported-by a:hover {
            color: #93C5FD;
            text-decoration: underline;
          }
          .footer-bottom {
            padding: 18px 20px;
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            font-size: 12.5px;
            color: #94A3B8;
            border-top: 1px solid #334155;
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
          .modal-header {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .modal-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          }
          .close-btn {
            background: none;
            border: none;
            font-size: 28px;
            color: #94A3B8;
            cursor: pointer;
            line-height: 1;
          }
          .close-btn:hover { color: #EF4444; }
          .modal-body {
            padding: 24px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.6;
          }
          .modal-body h4 {
            margin: 24px 0 10px 0;
            font-size: 15px;
            font-weight: 600;
            color: var(--primary-navy);
          }
          .modal-body p, .modal-body li {
            color: var(--text-muted);
          }
          .modal-footer {
            padding: 20px 24px;
            border-top: 1px solid var(--border-light);
            background: var(--bg-gray);
            text-align: right;
          }
          @media (max-width: 768px) {
            .footer-top { padding: 40px 16px; gap: 32px; }
            .footer-bottom { flex-direction: column; align-items: flex-start; gap: 20px; }
          }
          @media print {
            .no-print { display: none !important; }
            .confirm-box { box-shadow: none !important; margin: 0; max-width: none; }
            .app-container > *:not(.confirm-box) { display: none !important; }
          }
        `}
      </style>

      {showInitialPrivacy && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header"><h3>Privacy & Data Protection</h3></div>
            <div className="modal-body">
              <p style={{ color: "#475467", marginBottom: "20px" }}>Welcome to the Student Voting System. Please review and accept our privacy policy before continuing.</p>
              {legitPrivacyPolicy}
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleAcceptPrivacy}>I Understand and Accept</button>
            </div>
          </div>
        </div>
      )}

      {activeContent && !showInitialPrivacy && (
        <div className="modal-overlay" onClick={() => setActiveContent(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalContent[activeContent]?.title || "Information"}</h3>
              <button className="close-btn" onClick={() => setActiveContent(null)}>&times;</button>
            </div>
            <div className="modal-body">{modalContent[activeContent]?.body || <p>Content not available.</p>}</div>
          </div>
        </div>
      )}

      <footer className="footer-wrapper">
        <div className="footer-top">
          <div className="footer-column">
            <h4 className="footer-heading">Contact Info</h4>
            <div className="footer-list">
              <div className="contact-item"><span className="material-symbols-outlined contact-icon">mail</span><a href="mailto:admin@gmail.com" className="nav-link">admin@gmail.com</a></div>
              <div className="contact-item"><span className="material-symbols-outlined contact-icon">call</span><span>09168562198</span></div>
              <div className="contact-item"><span className="material-symbols-outlined contact-icon">location_on</span><span>Student Affairs Office</span></div>
            </div>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">About</h4>
            <div className="footer-list">
              <button onClick={() => setActiveContent('about')} className="nav-link">Election Process</button>
              <button onClick={() => setActiveContent('rules')} className="nav-link">Official Voting Rules</button>
              <button onClick={() => setActiveContent('privacy')} className="nav-link">Privacy & Data Policy</button>
              <button onClick={() => setActiveContent('terms')} className="nav-link">Terms of Service</button>
            </div>
          </div>
          <div className="footer-column wide">
            <h4 className="footer-heading">Student Voting System</h4>
            <p style={{ fontSize: "13.5px", lineHeight: "1.6", color: "#CBD5E1", marginBottom: "20px" }}>
              A secure, transparent, and fully encrypted electronic voting platform designed for fair student government elections at Asian College.
            </p>
            <button onClick={() => setActiveContent('help')} className="help-link">
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>help</span> Help Center & FAQ
            </button>
            <div className="supported-by">
              Supported by:
              <a href="https://www.asiancollege.edu.ph/" target="_blank" rel="noopener noreferrer">
                Asian College
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="copyright-text">
            <span style={{ color: "#F1F5F9", fontWeight: 500 }}>© {new Date().getFullYear()} Supreme Student Learners Government</span>
            <span>All rights reserved. Unauthorized access is strictly prohibited.</span>
          </div>
          <div className="platform-badge">
            Built with Supabase
            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#12B76A" }}>verified</span>
          </div>
        </div>
      </footer>
    </>
  );
};

// --- AuthForm ---
const AuthForm: React.FC<{ setPage: (p: Page) => void; setCurrentUser: (u: User) => void }> = ({ setPage, setCurrentUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ identifier: "", name: "", password: "", grade: "G7" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setPhotoFile(e.target.files[0]);
  };

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
    let photoUrl = "";

    if (!isLogin) {
      if (!name || !password) {
        setError("Please fill in all fields to register.");
        setLoading(false);
        return;
      }
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `student_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('student-photos').upload(fileName, photoFile, { upsert: true });
        if (!uploadError) {
          const { data } = supabase.storage.from('student-photos').getPublicUrl(fileName);
          photoUrl = data.publicUrl;
        }
      }
      const { data: existing } = await supabase.from('students').select('id').eq('id', identifier).single();
      if (existing) {
        setError("This 12-digit LRN is already registered.");
        setLoading(false);
        return;
      }
      const { data: newStudent, error: insertError } = await supabase
        .from('students')
        .insert([{ id: identifier, name, password, grade, has_voted: false, photo_url: photoUrl || null }])
        .select()
        .single();
      if (insertError) setError("Registration failed: " + insertError.message);
      else if (newStudent) {
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
      if (fetchError || !student) setError("Invalid Voter Credentials. Please try again.");
      else {
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
          <button className={isLogin ? "btn-light-blue" : "btn-outline-wide"} onClick={() => { setIsLogin(true); setError(""); }}>Login</button>
          <button className={!isLogin ? "btn-light-blue" : "btn-outline-wide"} onClick={() => { setIsLogin(false); setError(""); }}>Register</button>
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
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>Upload Profile Photo (Optional)</label>
                <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handlePhotoChange} style={{ width: "100%", padding: "8px", border: "1px solid var(--border-light)", borderRadius: "6px" }} />
              </div>
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

// --- CandidateProfile ---
const CandidateProfile: React.FC<{ setPage: (p: Page) => void; candidateId: string }> = ({ setPage, candidateId }) => {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      const { data } = await supabase.from('candidates').select('*').eq('id', candidateId).single();
      setCandidate(data);
      const { count } = await supabase.from('votes').select('*', { count: 'exact', head: true }).eq('candidate_id', candidateId);
      setVoteCount(count || 0);
      setLoading(false);
    };
    fetchCandidate();
  }, [candidateId]);

  if (loading) return <div className="screen-content flex-center">Loading candidate profile...</div>;
  if (!candidate) return <div>Candidate not found.</div>;

  const avatar = candidate.image_url || `https://ui-avatars.com/api/?name=${candidate.name}&background=E8F0FE&color=0B1736`;

  return (
    <div className="screen-content content-max-width">
      <ReturnButton onClick={() => setPage("admin_setup")} />
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <img src={avatar} alt={candidate.name} style={{ width: "140px", height: "140px", borderRadius: "50%", objectFit: "cover", border: "6px solid #e2e8f0", cursor: "zoom-in" }} onClick={() => setViewerImage(avatar)} />
        <h1 style={{ marginTop: "20px", marginBottom: "8px" }}>{candidate.name}</h1>
        <span className="badge-solid-teal" style={{ fontSize: "16px" }}>{candidate.position}</span>
      </div>
      <div className="card-box" style={{ background: "var(--bg-main)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "30px" }}>
          <div><h4>Current Votes</h4><h2 style={{ fontSize: "2.8rem", color: "var(--primary-navy)", margin: "8px 0" }}>{voteCount}</h2></div>
          <div><h4>Position</h4><p style={{ fontSize: "18px", fontWeight: 600 }}>{candidate.position}</p></div>
        </div>
        {candidate.campaign_text && (
          <div>
            <h4>Campaign Platform / Biography</h4>
            <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-light)", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{candidate.campaign_text}</div>
          </div>
        )}
      </div>
      {viewerImage && <PhotoViewerModal imageUrl={viewerImage} onClose={() => setViewerImage(null)} />}
    </div>
  );
};

// --- AdminSetup ---
const AdminSetup: React.FC<{ setPage: (p: Page) => void; onViewCandidate: (id: string) => void }> = ({ setPage, onViewCandidate }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [candidateForm, setCandidateForm] = useState({ name: "", position: "President", image_url: "", campaign_text: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const fetchCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('position');
    if (data) setCandidates(data);
  };

  useEffect(() => { fetchCandidates(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const saveCandidate = async () => {
    if (!candidateForm.name) return alert("Enter candidate name");
    setLoading(true);
    let finalImageUrl = candidateForm.image_url;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('candidate-photos').upload(fileName, imageFile, { upsert: true });
      if (uploadError) {
        alert("Error uploading image: " + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('candidate-photos').getPublicUrl(fileName);
      finalImageUrl = urlData.publicUrl;
    }
    if (editingId) {
      await supabase.from('candidates').update({
        name: candidateForm.name,
        position: candidateForm.position,
        image_url: finalImageUrl,
        campaign_text: candidateForm.campaign_text
      }).eq('id', editingId);
    } else {
      await supabase.from('candidates').insert([{
        name: candidateForm.name,
        position: candidateForm.position,
        image_url: finalImageUrl,
        campaign_text: candidateForm.campaign_text
      }]);
    }
    setCandidateForm({ name: "", position: "President", image_url: "", campaign_text: "" });
    setImageFile(null);
    setEditingId(null);
    fetchCandidates();
    setLoading(false);
  };

  const editCandidate = (c: Candidate) => {
    setEditingId(c.id);
    setCandidateForm({ name: c.name, position: c.position, image_url: c.image_url || "", campaign_text: c.campaign_text || "" });
    setImageFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCandidateForm({ name: "", position: "President", image_url: "", campaign_text: "" });
    setImageFile(null);
  };

  const groupedCandidates = POSITIONS.reduce((acc: Record<string, Candidate[]>, pos) => {
    acc[pos] = candidates.filter(c => c.position === pos);
    return acc;
  }, {} as Record<string, Candidate[]>);

  return (
    <div className="screen-content content-max-width">
      <div className="flex-between" style={{ marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>Phase 1: Pre-Election Setup</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn-outline-wide" onClick={() => setPage("admin_voters")}>Voter Audit</button>
          <button className="btn-light-blue" onClick={() => setPage("results")}>Live Results</button>
          <button className="btn-outline-wide" onClick={() => setPage("print_results")}>Print Results</button>
        </div>
      </div>

      <div className="status-card" style={{ marginBottom: "24px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ width: "32px", height: "32px", fontSize: "18px" }}>{editingId ? "edit" : "person_add"}</span>
          {editingId ? "Edit Candidate" : "Add New Candidate"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input placeholder="Candidate Name" value={candidateForm.name} onChange={e => setCandidateForm({...candidateForm, name: e.target.value})} style={{ flex: 1, minWidth: "200px" }} />
            <select value={candidateForm.position} onChange={e => setCandidateForm({...candidateForm, position: e.target.value})} style={{ padding: "12px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "13px", minWidth: "200px" }}>
              {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Upload Candidate Photo</label>
            <input id="photo-upload" type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} style={{ padding: "8px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "13px", width: "100%" }} />
          </div>
          <textarea placeholder="Campaign Platform / Biography (Optional)" value={candidateForm.campaign_text} onChange={e => setCandidateForm({...candidateForm, campaign_text: e.target.value})} style={{ padding: "12px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "13px", minHeight: "80px", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn-primary" onClick={saveCandidate} disabled={loading} style={{ width: "auto", padding: "12px 24px" }}>
              {loading ? "Saving..." : (editingId ? "Update Candidate" : "Save Candidate")}
            </button>
            {editingId && <button className="btn-outline-wide" onClick={cancelEdit} style={{ width: "auto", padding: "12px 24px" }}>Cancel Edit</button>}
          </div>
        </div>
      </div>

      <div className="card-box" style={{ background: "var(--bg-main)" }}>
        <h3>Current Candidates by Position</h3>
        {candidates.length === 0 ? (
          <p className="mt-1" style={{ color: "var(--text-muted)", fontSize: "13px" }}>No candidates added yet.</p>
        ) : (
          POSITIONS.map(position => {
            const posCandidates = groupedCandidates[position] || [];
            if (posCandidates.length === 0) return null;
            return (
              <div key={position} style={{ marginBottom: "36px", background: "#f8fafc", border: "2px solid var(--border-light)", borderRadius: "16px", padding: "24px" }}>
                <h4 style={{ fontSize: "21px", fontWeight: 700, color: "var(--primary-navy)", marginBottom: "20px" }}>{position}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {posCandidates.map(c => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", border: "1px solid var(--border-light)", borderRadius: "12px", background: "#ffffff", boxShadow: "0 3px 10px rgba(0,0,0,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                        <img src={c.image_url || `https://ui-avatars.com/api/?name=${c.name}&background=E8F0FE&color=0B1736`} alt={c.name} style={{ width: "54px", height: "54px", borderRadius: "50%", objectFit: "cover" }} />
                        <div><div style={{ fontWeight: 600, fontSize: "16.5px" }}>{c.name}</div></div>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button className="btn-light-blue" onClick={() => onViewCandidate(c.id)} style={{ padding: "9px 18px", fontSize: "13px" }}>View Profile</button>
                        <button className="btn-light-blue" onClick={() => editCandidate(c)} style={{ padding: "9px 18px", fontSize: "13px" }}>Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
      {viewerImage && <PhotoViewerModal imageUrl={viewerImage} onClose={() => setViewerImage(null)} />}
    </div>
  );
};

// --- AdminVotersList ---
const AdminVotersList: React.FC<{
  setPage: (p: Page) => void;
  onViewProfile: (id: string) => void
}> = ({ setPage, onViewProfile }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  const fetchStudentsWithVotes = async () => {
    setLoading(true);
    const { data: studentsData } = await supabase
      .from('students')
      .select('*')
      .order('name');

    if (!studentsData) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const { data: votesData } = await supabase
      .from('votes')
      .select('student_id');

    const votedStudentIds = new Set((votesData || []).map(v => v.student_id));

    const studentsWithStatus = studentsData.map(student => ({
      ...student,
      has_voted: votedStudentIds.has(student.id) || student.has_voted
    }));

    setStudents(studentsWithStatus);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudentsWithVotes();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStudentsWithVotes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const filteredStudents = gradeFilter === "All" ? students : students.filter(s => s.grade === gradeFilter);

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
          <button className="btn-outline-wide" onClick={fetchStudentsWithVotes} style={{ width: "auto", padding: "8px 16px" }}>Refresh</button>
        </div>
      </div>

      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <label style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-muted)" }}>Filter by Grade:</label>
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} style={{ padding: "8px 16px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "14px" }}>
          <option value="All">All Grades</option>
          <option value="G7">Grade 7</option>
          <option value="G8">Grade 8</option>
          <option value="G9">Grade 9</option>
          <option value="G10">Grade 10</option>
          <option value="G11">Grade 11</option>
          <option value="G12">Grade 12</option>
        </select>
      </div>

      <div className="card-box" style={{ background: "var(--bg-main)", overflowX: "auto" }}>
        {loading ? (
          <p className="text-center" style={{ padding: "20px" }}>Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-center" style={{ padding: "20px" }}>No students found.</p>
        ) : (
          <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)", color: "var(--text-muted)" }}>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Student Name</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>LRN (12-Digit ID)</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Grade/Section</th>
                <th style={{ padding: "12px 8px", fontWeight: 600 }}>Voting Status</th>
                <th style={{ padding: "12px 8px", fontWeight: 600, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "14px 8px", fontWeight: 600, color: "var(--text-main)" }}>{s.name}</td>
                  <td style={{ padding: "14px 8px", fontFamily: "monospace", color: "var(--text-muted)" }}>{s.id}</td>
                  <td style={{ padding: "14px 8px" }}><span className="badge-light-blue">{s.grade}</span></td>
                  <td style={{ padding: "14px 8px" }}>
                    {s.has_voted ? (
                      <span style={{ background: "var(--accent-teal)", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" }}>VOTED</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em" }}>PENDING</span>
                    )}
                  </td>
                  <td style={{ padding: "14px 8px", textAlign: "center" }}>
                    <button className="btn-light-blue" onClick={() => onViewProfile(s.id)} style={{ width: "auto", padding: "6px 14px", fontSize: "12px" }}>View Profile</button>
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

// --- Student Profile ---
const StudentProfile: React.FC<{ setPage: (p: Page) => void; studentId: string }> = ({ setPage, studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [votes, setVotes] = useState<{ id: string; candidate: { name: string; position: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      const { data: stuData, error: stuError } = await supabase.from('students').select('*').eq('id', studentId).single();
      if (stuError || !stuData) {
        setError("Student not found.");
        setLoading(false);
        return;
      }
      setStudent(stuData as Student);

      const { data: voteData } = await supabase
        .from('votes')
        .select(`id, candidates!candidate_id (name, position)`)
        .eq('student_id', studentId);

      const transformedVotes = (voteData || []).map((vote: any) => ({
        id: vote.id,
        candidate: vote.candidates?.[0] || { name: '', position: '' }
      }));

      setVotes(transformedVotes);
      setLoading(false);
    };
    fetchProfile();
  }, [studentId]);

  if (loading) return <div className="screen-content flex-center">Loading student profile...</div>;
  if (error || !student) {
    return (
      <div className="screen-content content-max-width">
        <ReturnButton onClick={() => setPage("admin_voters")} />
        <div className="card-box" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "#D92D20" }}>{error || "Student profile could not be loaded."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-content content-max-width">
      <ReturnButton onClick={() => setPage("admin_voters")} />
      <div className="flex-between" style={{ marginBottom: "24px" }}>
        <div>
          <span className="overline">Student Profile</span>
          <h1>{student.name}</h1>
        </div>
        <div>
          <span className={`badge-${student.has_voted ? "accent-teal" : "light-blue"}`}>
            {student.has_voted ? "Has Voted" : "Pending"}
          </span>
        </div>
      </div>
      <div className="card-box" style={{ background: "var(--bg-main)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <h4 style={{ marginBottom: "8px" }}>LRN / Voter ID</h4>
            <p style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: 600 }}>{student.id}</p>
          </div>
          <div>
            <h4 style={{ marginBottom: "8px" }}>Grade / Section</h4>
            <p style={{ fontSize: "18px" }}>{student.grade}</p>
          </div>
        </div>
        <h3 style={{ margin: "32px 0 16px 0" }}>Votes Cast (Per Representative)</h3>
        {votes.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>This student has not cast any votes yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {votes.map((vote) => (
              <div key={vote.id} style={{ padding: "16px", background: "white", borderRadius: "8px", border: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><strong style={{ fontSize: "15px" }}>{vote.candidate.position}</strong></div>
                <div style={{ fontWeight: 600, color: "var(--primary-navy)" }}>{vote.candidate.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {viewerImage && <PhotoViewerModal imageUrl={viewerImage} onClose={() => setViewerImage(null)} />}
    </div>
  );
};

// --- BallotPage ---
const BallotPage: React.FC<{ setPage: (p: Page) => void; currentUser: Student }> = ({ setPage, currentUser }) => {
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVotingStatus = async () => {
      if (currentUser.has_voted) {
        setPage("results");
        return;
      }

      const { data: studentData } = await supabase
        .from('students')
        .select('has_voted')
        .eq('id', currentUser.id)
        .single();

      if (studentData?.has_voted) {
        setPage("results");
        return;
      }

      const { data: existingVotes } = await supabase
        .from('votes')
        .select('id')
        .eq('student_id', currentUser.id)
        .limit(1);

      if (existingVotes && existingVotes.length > 0) {
        setPage("results");
        return;
      }

      const { data } = await supabase.from('candidates').select('*');
      if (data) setCandidates(data);
      setLoading(false);
    };

    checkVotingStatus();
  }, [currentUser.id, setPage]);

  const handleSubmit = async () => {
    const missingPositions = POSITIONS.filter(pos => !selectedCandidates[pos]);
    if (missingPositions.length > 0) {
      return setError(`Please select one candidate for each position. Missing: ${missingPositions.join(", ")}`);
    }

    setLoading(true);
    setError("");

    try {
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('id')
        .eq('student_id', currentUser.id)
        .limit(1);

      if (existingVotes && existingVotes.length > 0) {
        setError("You have already voted.");
        setLoading(false);
        return;
      }

      const voteInserts = POSITIONS.map(position => ({
        student_id: currentUser.id,
        candidate_id: selectedCandidates[position]!,
        position: position
      }));

      const { error: voteError } = await supabase.from('votes').insert(voteInserts);
      if (voteError) {
        setError("Error submitting vote: " + voteError.message);
        setLoading(false);
        return;
      }

      await supabase.from('students').update({ has_voted: true }).eq('id', currentUser.id);

      const receiptId = Math.random().toString(36).substr(2, 12).toUpperCase();
      const receipt = {
        receiptId,
        timestamp: new Date().toISOString(),
        studentName: currentUser.name,
        grade: currentUser.grade
      };
      localStorage.setItem(`receipt_${currentUser.id}`, JSON.stringify(receipt));

      const { data: updatedStudent } = await supabase
        .from('students')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (updatedStudent) {
        localStorage.setItem("currentUser", JSON.stringify(updatedStudent));
      }

      setPage("confirm");
    } catch (err: any) {
      setError("Unexpected error: " + (err.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedCampaign(expandedCampaign === id ? null : id);
  };

  if (loading) return <div className="screen-content flex-center">Loading ballot...</div>;

  const grouped = POSITIONS.reduce((acc: Record<string, Candidate[]>, pos) => {
    acc[pos] = candidates.filter(c => c.position === pos);
    return acc;
  }, {} as Record<string, Candidate[]>);

  return (
    <div className="screen-content content-max-width">
      <div style={{ marginBottom: "24px" }}>
        <span className="overline">Phase 2: Electronic Ballot</span>
        <h1>Official Voting Ballot</h1>
        <p>Welcome, <strong>{currentUser.name}</strong> ({currentUser.grade}). You must select <strong>one candidate per position</strong>.</p>
      </div>

      {error && <div style={{ color: "#D92D20", background: "#FEF3F2", padding: "12px", borderRadius: "8px", fontSize: "12px", marginBottom: "24px", fontWeight: 600 }}>{error}</div>}

      {POSITIONS.map((position) => {
        const posCandidates = grouped[position] || [];
        const selectedId = selectedCandidates[position];
        return (
          <div key={position} style={{ marginBottom: "36px" }}>
            <div style={{ background: "#f8fafc", border: "2px solid var(--border-light)", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ fontSize: "21px", fontWeight: 700, color: "var(--primary-navy)", marginBottom: "20px" }}>{position}</h3>
              <div className="candidate-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "18px" }}>
                {posCandidates.map(c => {
                  const avatar = c.image_url || `https://ui-avatars.com/api/?name=${c.name}&background=E8F0FE&color=0B1736`;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCandidates(prev => ({ ...prev, [position]: c.id }))}
                      className={`candidate-card ${selectedId === c.id ? "selected" : ""}`}
                      style={{ height: "100%" }}
                    >
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <img
                          src={avatar}
                          alt={c.name}
                          style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", cursor: "zoom-in" }}
                          onClick={(e) => { e.stopPropagation(); setEnlargedPhoto(avatar); }}
                        />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <h3 style={{ fontSize: "18px" }}>{c.name}</h3>
                      </div>
                      {c.campaign_text && (
                        <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px", marginTop: "auto" }}>
                          <button onClick={(e) => toggleCampaign(e, c.id)} style={{ background: "none", border: "none", color: "var(--primary-blue)", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", margin: "0 auto" }}>
                            {expandedCampaign === c.id ? "Hide Campaign" : "View Campaign Platform"}
                            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{expandedCampaign === c.id ? "expand_less" : "expand_more"}</span>
                          </button>
                          {expandedCampaign === c.id && <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "12px", lineHeight: "1.6", textAlign: "center" }}>{c.campaign_text}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      <div className="button-stack" style={{ marginTop: "32px" }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting Secure Ballot..." : "Securely Submit All Votes"}
        </button>
        <button className="btn-light-blue" onClick={() => setPage("results")}>View Live Results</button>
      </div>

      {enlargedPhoto && <PhotoViewerModal imageUrl={enlargedPhoto} onClose={() => setEnlargedPhoto(null)} />}
    </div>
  );
};

const ConfirmationScreen: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => (
  <div className="screen-content flex-center" style={{ minHeight: "calc(100vh - 80px)", padding: "20px" }}>
    <div className="confirm-box" style={{ maxWidth: "520px", width: "100%", margin: "0 auto", padding: "50px 40px", textAlign: "center", background: "white", borderRadius: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
      <div style={{ marginBottom: "28px" }}>
        <span className="material-symbols-outlined success-icon" style={{ fontSize: "78px", color: "#10b981", background: "#ecfdf5", padding: "20px", borderRadius: "50%" }}>task_alt</span>
      </div>
      <h2 style={{ marginBottom: "14px", fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>Vote Submitted Successfully!</h2>
      <p style={{ marginBottom: "40px", fontSize: "16px", lineHeight: "1.6", color: "#475467", maxWidth: "380px", marginLeft: "auto", marginRight: "auto" }}>
        Your encrypted ballot has been safely recorded for every position.
      </p>
      <div className="audit-receipt" style={{ background: "#f8fafc", border: "2px solid #0B1736", borderRadius: "16px", padding: "28px", marginBottom: "36px", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span className="material-symbols-outlined" style={{ color: "#0B1736", fontSize: "28px" }}>lock</span>
          <span className="overline" style={{ color: "#0B1736", fontWeight: 700 }}>OFFICIAL VOTE RECEIPT</span>
        </div>
        <p style={{ margin: "8px 0 4px", fontSize: "13px", color: "#475467" }}>Receipt ID</p>
        <div style={{ fontFamily: "monospace", fontSize: "15px", padding: "14px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
          {Math.random().toString(36).substr(2, 12).toUpperCase()}
        </div>
        <p style={{ margin: "8px 0 4px", fontSize: "13px", color: "#475467" }}>Timestamp</p>
        <div style={{ padding: "14px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          {new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
        </div>
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px dashed #94A3B8", fontSize: "12.5px", color: "#64748b", textAlign: "center" }}>
          This receipt is for your records only.<br />Your vote is anonymous and cannot be traced back to you.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <button className="btn-outline-wide" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>print</span> Print Receipt
        </button>
        <button className="btn-light-blue" onClick={() => setPage("results")} style={{ padding: "14px" }}>View Live Results</button>
      </div>
    </div>
  </div>
);

// --- ResultsDashboard ---
const ResultsDashboard: React.FC<{ currentUser: User | null; setPage: (p: Page) => void }> = ({ currentUser, setPage }) => {
  const [results, setResults] = useState<{ candidate: Candidate, count: number }[]>([]);
  const [stats, setStats] = useState({ totalRegistered: 0, totalVotesCast: 0 });
  const [viewerImage, setViewerImage] = useState<string | null>(null);

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
      setStats({ totalRegistered, totalVotesCast: votes.length });
    };
    fetchResults();
  }, []);

  const turnoutPercent = stats.totalRegistered > 0 ? Math.round((stats.totalVotesCast / stats.totalRegistered) * 100) : 0;
  const isAdmin = currentUser && 'isAdmin' in currentUser && currentUser.isAdmin;
  const isStudent = currentUser && !isAdmin && 'has_voted' in currentUser;

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
          {isStudent && (
            <button 
              className="btn-light-blue" 
              onClick={() => setPage("my_receipt")} 
              style={{ width: "auto", padding: "8px 16px" }}
            >
              View My Receipt
            </button>
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
        {results.map((r) => {
          const percentage = stats.totalVotesCast > 0 ? Math.round((r.count / stats.totalVotesCast) * 100) : 0;
          const avatar = r.candidate.image_url || `https://ui-avatars.com/api/?name=${r.candidate.name}&background=E8F0FE&color=0B1736`;
          return (
            <div key={r.candidate.id} className="result-item">
              <img src={avatar} alt={r.candidate.name} className="result-avatar" style={{ objectFit: "cover", cursor: "zoom-in" }} onClick={() => setViewerImage(avatar)} />
              <div style={{ flex: 1 }}>
                <div className="flex-between" style={{ marginBottom: "8px" }}>
                  <div>
                    <strong>{r.candidate.name}</strong> <span className="badge-solid-teal" style={{ marginLeft: "8px" }}>{r.candidate.position}</span>
                  </div>
                  <strong style={{ fontSize: "16px" }}>{r.count}</strong>
                </div>
                <div className="result-bar-bg">
                  <div className="result-bar-fill" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {viewerImage && <PhotoViewerModal imageUrl={viewerImage} onClose={() => setViewerImage(null)} />}
    </div>
  );
};

// --- My Receipt Page ---
const MyReceiptPage: React.FC<{ setPage: (p: Page) => void; currentUser: Student }> = ({ setPage, currentUser }) => {
  const receiptStr = localStorage.getItem(`receipt_${currentUser.id}`);
  const receipt = receiptStr ? JSON.parse(receiptStr) : null;

  if (!receipt) {
    return (
      <div className="screen-content content-max-width">
        <ReturnButton onClick={() => setPage("results")} />
        <div className="card-box" style={{ textAlign: "center", padding: "60px 20px" }}>
          <h2>No Receipt Found</h2>
          <p>You have not voted yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-content content-max-width">
      <ReturnButton onClick={() => setPage("results")} />
      <div style={{ maxWidth: "500px", margin: "40px auto", textAlign: "center" }}>
        <h1 style={{ marginBottom: "8px" }}>Your Voting Receipt</h1>
        <p style={{ color: "#64748b", marginBottom: "32px" }}>Keep this for your records</p>

        <div style={{ background: "#f8fafc", border: "2px solid #0B1736", borderRadius: "16px", padding: "32px", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#0B1736" }}>lock</span>
            <span style={{ fontWeight: 700, fontSize: "18px", color: "#0B1736" }}>OFFICIAL VOTE RECEIPT</span>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", color: "#475467", marginBottom: "4px" }}>Receipt ID</div>
            <div style={{ fontFamily: "monospace", fontSize: "16px", padding: "12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              {receipt.receiptId}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "13px", color: "#475467", marginBottom: "4px" }}>Voter Name</div>
            <div style={{ padding: "12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              {receipt.studentName} ({receipt.grade})
            </div>
          </div>

          <div>
            <div style={{ fontSize: "13px", color: "#475467", marginBottom: "4px" }}>Submission Time</div>
            <div style={{ padding: "12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              {new Date(receipt.timestamp).toLocaleString()}
            </div>
          </div>

          <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "1px dashed #94A3B8", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
            Your vote is anonymous and has been securely recorded.<br />
            Thank you for participating in the election.
          </div>
        </div>

        <div style={{ marginTop: "32px" }}>
          <button className="btn-outline-wide" onClick={() => window.print()} style={{ width: "100%", padding: "14px" }}>
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Print Results Page ---
const PrintResults: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => {
  const [results, setResults] = useState<{ candidate: Candidate; count: number }[]>([]);
  const [stats, setStats] = useState({ totalRegistered: 0, totalVotesCast: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [candRes, voteRes, stuRes] = await Promise.all([
        supabase.from('candidates').select('*'),
        supabase.from('votes').select('candidate_id'),
        supabase.from('students').select('id', { count: 'exact' })
      ]);
      const candidates = candRes.data || [];
      const votes = voteRes.data || [];
      const totalRegistered = stuRes.count || 0;

      const tally = candidates.map(c => ({
        candidate: c,
        count: votes.filter(v => v.candidate_id === c.id).length
      })).sort((a, b) => b.count - a.count);

      setResults(tally);
      setStats({ totalRegistered, totalVotesCast: votes.length });
      setLoading(false);
    };
    fetchData();
  }, []);

  const turnout = stats.totalRegistered > 0 ? Math.round((stats.totalVotesCast / stats.totalRegistered) * 100) : 0;

  if (loading) return <div className="screen-content flex-center">Preparing report...</div>;

  return (
    <div className="screen-content content-max-width">
      <ReturnButton onClick={() => setPage("admin_setup")} />
      <div className="no-print" style={{ marginBottom: "30px", textAlign: "center" }}>
        <button className="btn-primary" onClick={() => window.print()} style={{ padding: "14px 32px", fontSize: "16px" }}>
           Print Official Results
        </button>
      </div>
      <div id="printable-results" style={{ background: "white", padding: "50px", maxWidth: "900px", margin: "0 auto", border: "2px solid #0B1736" }}>
        <h1 style={{ textAlign: "center", marginBottom: "10px", color: "#0B1736" }}>Official Student Election Results</h1>
        <p style={{ textAlign: "center", color: "#555", marginBottom: "40px" }}>Generated on {new Date().toLocaleString()}</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px", fontSize: "16px" }}>
          <div><strong>Total Registered Voters:</strong> {stats.totalRegistered}</div>
          <div><strong>Total Votes Cast:</strong> {stats.totalVotesCast}</div>
          <div><strong>Voter Turnout:</strong> {turnout}%</div>
        </div>
        <h2 style={{ borderBottom: "3px solid #0B1736", paddingBottom: "12px", marginBottom: "25px" }}>Candidate Standings</h2>
        {results.map((r, index) => {
          const percentage = stats.totalVotesCast > 0 ? Math.round((r.count / stats.totalVotesCast) * 100) : 0;
          return (
            <div key={r.candidate.id} style={{ padding: "18px 0", borderBottom: index < results.length - 1 ? "1px solid #ddd" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <img src={r.candidate.image_url || `https://ui-avatars.com/api/?name=${r.candidate.name}&background=E8F0FE&color=0B1736`} alt={r.candidate.name} style={{ width: "55px", height: "55px", borderRadius: "50%", objectFit: "cover" }} />
                <div>
                  <strong style={{ fontSize: "17px" }}>{r.candidate.name}</strong>
                  <div style={{ color: "#555" }}>{r.candidate.position}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#0B1736" }}>{r.count}</div>
                <div style={{ fontSize: "14px", color: "#666" }}>{percentage}% of total votes</div>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: "60px", textAlign: "center", color: "#666", fontSize: "14px" }}>
          Supreme Student Learners Government • Official Results
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
const App: React.FC = () => {
  const [page, setPage] = useState<Page>("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
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
    setSelectedStudentId(null);
    setSelectedCandidateId(null);
  };

  if (loading) return <div className="flex-center" style={{ height: "100vh" }}>Loading System...</div>;

  return (
    <div className="app-container">
      {page !== "login" && <Header currentUser={currentUser} handleLogout={handleLogout} />}

      {page === "login" && <AuthForm setPage={setPage} setCurrentUser={setCurrentUser} />}
      {page === "admin_setup" && <AdminSetup setPage={setPage} onViewCandidate={(id) => { setSelectedCandidateId(id); setPage("candidate_profile"); }} />}
      {page === "admin_voters" && (
        <AdminVotersList
          setPage={setPage}
          onViewProfile={(id) => {
            setSelectedStudentId(id);
            setPage("student_profile");
          }}
        />
      )}
      {page === "ballot" && currentUser && !('isAdmin' in currentUser) && <BallotPage setPage={setPage} currentUser={currentUser as Student} />}
      {page === "confirm" && <ConfirmationScreen setPage={setPage} />}
      {page === "results" && <ResultsDashboard currentUser={currentUser} setPage={setPage} />}
      {page === "student_profile" && selectedStudentId && <StudentProfile setPage={setPage} studentId={selectedStudentId} />}
      {page === "candidate_profile" && selectedCandidateId && <CandidateProfile setPage={setPage} candidateId={selectedCandidateId} />}
      {page === "print_results" && <PrintResults setPage={setPage} />}
      {page === "my_receipt" && currentUser && !('isAdmin' in currentUser) && <MyReceiptPage setPage={setPage} currentUser={currentUser as Student} />}

      <Footer />
    </div>
  );
};

export default App;