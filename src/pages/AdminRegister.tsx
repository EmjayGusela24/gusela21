import React, { useState } from "react";
import { supabase } from "../supabase";
import { Page } from "../types";
import ReturnButton from "../components/ReturnButton";
import { fileToByteaHex, fileToDataUrl } from "../utils/imageUtils";
import "./AdminRegister.css";


const AdminRegister: React.FC<{ setPage: (p: Page) => void }> = ({ setPage }) => {
  const [form, setForm] = useState({
    name: "",
    lrn: "",
    grade: "G7",
    section: "",
    age: "",
    password: ""
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [clipboardAlert, setClipboardAlert] = useState(false);

  const blockClipboard = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setClipboardAlert(true);
    setTimeout(() => setClipboardAlert(false), 3000);
  };

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      // Store hex string for bytea column, data URL for preview and text column
      const hexStr = await fileToByteaHex(file);
      const dataUrl = await fileToDataUrl(file);
      setPhotoBase64(hexStr);       // goes to photo (bytea) column
      setPreviewUrl(dataUrl);       // used for live preview in the form
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return setError("Please enter student name");
    if (!/^\d{12}$/.test(form.lrn)) return setError("LRN must be exactly 12 digits");
    if (!form.section.trim()) return setError("Please enter a section");

    // Validate age range safely
    const parsedAge = parseInt(form.age, 10);
    if (isNaN(parsedAge) || parsedAge < 5 || parsedAge > 100) {
      return setError("Please enter a valid age");
    }

    if (!form.password) return setError("Please enter a password");

    setLoading(true);
    setError("");

    try {
      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("id", form.lrn)
        .single();

      if (existing) {
        setError("A student with this LRN already exists");
        setLoading(false);
        return;
      }

      // Hash password server-side using bcrypt before storing
      const { data: hashData, error: hashError } = await supabase.rpc("hash_password", {
        plain_password: form.password,
      });

      if (hashError || !hashData) {
        setError("Failed to secure password. Please try again.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("students").insert([
        {
          id: form.lrn,
          name: form.name.trim(),
          password: hashData as string,
          grade: form.grade,
          section: form.section.trim(),
          age: parsedAge,
          has_voted: false,
          photo: photoBase64,           // \xHEX string → PostgREST casts to bytea
          photo_url: previewUrl,         // data URL string → stored in text column
        },
      ]);


      if (insertError) {
        console.error('Supabase insert error:', insertError);
        const detailed = insertError.message || JSON.stringify(insertError);
        setError(`Insert failed: ${detailed}`);
        throw insertError;
      }

      setSuccess(true);
      setForm({ name: "", lrn: "", grade: "G7", section: "", age: "", password: "" });
      setPreviewUrl(null);
      setPhotoBase64(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="screen-content content-max-width">
        <ReturnButton onClick={() => setPage("admin_setup")} />
        <div style={{ maxWidth: "600px", margin: "40px auto 0 auto", width: "100%" }}>
          <div className="card-box" style={{ textAlign: "center", padding: "80px 40px", background: "white" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "88px", color: "var(--accent-teal, #12B76A)", marginBottom: "24px" }}>
              check_circle
            </span>
            <h2 style={{ fontSize: "28px", color: "var(--primary-navy)", fontWeight: 800, marginBottom: "12px" }}>
              Student Registered Successfully!
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "32px", lineHeight: "1.6" }}>
              The student has been successfully added to the system database and is ready to cast their vote.
            </p>
            <button className="btn-primary" onClick={() => setSuccess(false)} style={{ padding: "14px 28px", fontSize: "15px", fontWeight: 700, width: "auto", margin: "0 auto" }}>
              Register Another Student
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-content content-max-width">
      <ReturnButton onClick={() => setPage("admin_setup")} />
      <div style={{ width: "100%", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "8px" }}>Register New Student</h1>
        <p style={{ color: "#64748b", marginBottom: "32px" }}>Add a new student to the voters list</p>

        {error && (
          <div style={{ color: "#D92D20", background: "#FEF3F2", padding: "12px", borderRadius: "8px", fontSize: "12px", marginBottom: "24px", fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div className="admin-landscape-layout">
          {/* Left Column - Real-time Preview Panel */}
          <div className="admin-sidebar">
            <div className="preview-card" style={{ background: "white" }}>
              <span className="overline" style={{ color: "var(--primary-navy)", fontWeight: 700, marginBottom: "16px" }}>Real-time ID Card Preview</span>
              
              <div style={{ padding: "24px 20px", background: "linear-gradient(145deg, #ffffff, #f8fafc)", borderRadius: "16px", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.03)" }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                ) : (
                  <div className="preview-avatar-box">
                    <span className="material-symbols-outlined" style={{ fontSize: "44px", color: "#94a3b8" }}>person</span>
                  </div>
                )}
                
                <div style={{ textAlign: "center", width: "100%" }}>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "17px", color: "var(--primary-navy)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {form.name.trim() || "Student Full Name"}
                  </h4>
                  <div style={{ fontFamily: "monospace", fontSize: "12px", color: "var(--text-light)", marginBottom: "12px", letterSpacing: "0.05em" }}>
                    LRN: {form.lrn || "############"}
                  </div>
                  
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <span style={{ fontSize: "11px", background: "#EFF6FF", color: "#1E40AF", padding: "3px 10px", borderRadius: "6px", fontWeight: 700 }}>
                      {form.grade}
                    </span>
                    <span style={{ fontSize: "11px", background: "#ECFDF5", color: "#065F46", padding: "3px 10px", borderRadius: "6px", fontWeight: 700 }}>
                      Sec: {form.section.trim() || "---"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Form Entry */}
          <div className="admin-main-content">
            <div className="card-box" style={{ background: "var(--bg-main)", padding: "32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                
                {/* Profile Picture Upload Section */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                    Profile Picture Upload
                  </label>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                    style={{ padding: "12px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-gray)", fontSize: "13px", width: "100%", boxSizing: "border-box" }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-light)", marginTop: "6px" }}>Accepted files: PNG, JPG, JPEG</span>
                </div>

                {/* Full Name Input */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>Full Name *</label>
                  <input name="name" placeholder="Enter student full name" value={form.name} onChange={handleChange} style={{ width: "100%", padding: "14px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "14px", boxSizing: "border-box" }} />
                </div>

                {/* LRN Input */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>LRN (12-Digit Identifier) *</label>
                  <input name="lrn" placeholder="Enter LRN" value={form.lrn} onChange={handleChange} maxLength={12} autoComplete="off" style={{ width: "100%", padding: "14px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "14px", fontFamily: "monospace", boxSizing: "border-box" }} />
                </div>

                {/* Grade Level Selector */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>Grade Level *</label>
                  <select name="grade" value={form.grade} onChange={handleChange} style={{ width: "100%", padding: "14px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "14px", height: "50px", boxSizing: "border-box" }}>
                    <option value="G7">Grade 7</option>
                    <option value="G8">Grade 8</option>
                    <option value="G9">Grade 9</option>
                    <option value="G10">Grade 10</option>
                    <option value="G11">Grade 11</option>
                    <option value="G12">Grade 12</option>
                  </select>
                </div>

                {/* Age Input */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>Age *</label>
                  <input name="age" type="number" min={5} max={100} placeholder="Age" value={form.age} onChange={handleChange} style={{ width: "100%", padding: "14px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "14px", height: "50px", boxSizing: "border-box" }} />
                </div>

                {/* Section Input */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>Section *</label>
                  <input name="section" placeholder="e.g., Einstein" value={form.section} onChange={handleChange} style={{ width: "100%", padding: "14px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "14px", height: "50px", boxSizing: "border-box" }} />
                </div>

                {/* Password Input */}
                <div>
                  <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px", display: "block" }}>Password *</label>
                  <input name="password" type="password" placeholder="Enter login password" value={form.password} onChange={handleChange} onCopy={blockClipboard} onCut={blockClipboard} onPaste={blockClipboard} autoComplete="off" style={{ width: "100%", padding: "14px", border: "1px solid var(--border-light)", borderRadius: "6px", background: "var(--bg-main)", fontSize: "14px", boxSizing: "border-box" }} />
                </div>

              </div>

              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "flex-end" }}>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: "auto", minWidth: "200px", padding: "16px 32px", fontSize: "15px", fontWeight: 700 }}>
                  {loading ? "Registering..." : "Register Student"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Clipboard Security Toast */}
      {clipboardAlert && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#FFFFFF",
          color: "#DC2626",
          border: "1px solid #000000",
          padding: "6px 10px",
          borderRadius: "4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
          fontWeight: 650,
          zIndex: 99999,
          animation: "slideUpIn 0.22s ease",
          whiteSpace: "nowrap",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#DC2626" }}>block</span>
          <span>Invalid Action</span>
        </div>
      )}
    </div>
  );
};

export default AdminRegister;