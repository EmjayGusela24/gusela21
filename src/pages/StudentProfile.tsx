import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Student, Page } from "../types";
import ReturnButton from "../components/ReturnButton";
import { base64ToImageUrl } from "../utils/imageUtils";

const StudentProfile: React.FC<{
  setPage: (p: Page) => void;
  studentId: string;
}> = ({ setPage, studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [votes, setVotes] = useState<{ id: string; candidate: { name: string; position: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");

      const { data: stuData, error: stuError } = await supabase
        .from("students")
        .select("*")
        .eq("id", studentId)
        .single();

      if (stuError || !stuData) {
        setError("Student not found.");
        setLoading(false);
        return;
      }

      setStudent(stuData as Student);

      const { data: voteData } = await supabase
        .from("votes")
        .select("id, candidate_id, candidates:candidate_id (name, position)")
        .eq("student_id", studentId);

      const transformedVotes = (voteData || []).map((vote: any) => {
        const candidate = vote?.candidates;
        return {
          id: vote.id,
          candidate: candidate || { name: "", position: "" },
        };
      });

      setVotes(transformedVotes);
      setLoading(false);
    };

    run();
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

      <div style={{ position: "relative", background: "white", border: "1px solid var(--border-light)", borderRadius: "24px", padding: "32px", color: "var(--primary-navy)", marginBottom: "32px", boxShadow: "0 10px 40px rgba(11,23,54,0.06)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-50px", right: "-50px", width: "200px", height: "200px", background: "radial-gradient(circle, rgba(11,23,54,0.04) 0%, rgba(11,23,54,0) 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div className="flex-between" style={{ gap: "20px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <img
              src={
                base64ToImageUrl(student.photo_url) ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=E8F0FE&color=0B1736`
              }
              alt={student.name}
              style={{ width: "80px", height: "80px", borderRadius: "20px", objectFit: "cover", border: "2px solid var(--border-light)", boxShadow: "0 8px 16px rgba(0,0,0,0.08)" }}
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=E8F0FE&color=0B1736`; }}
            />
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-light)" }}>Student Profile</span>
              <h1 style={{ margin: "4px 0 0 0", color: "var(--primary-navy)", fontSize: "28px" }}>{student.name}</h1>
            </div>
          </div>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "99px", background: student.has_voted ? "#ecfdf5" : "#f1f5f9", border: `1px solid ${student.has_voted ? "#a7f3d0" : "#e2e8f0"}`, color: student.has_voted ? "#059669" : "#475467", fontWeight: 600, fontSize: "14px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{student.has_voted ? "check_circle" : "pending"}</span>
              {student.has_voted ? "Has Voted" : "Pending"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f1f5f9", color: "#475467", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined">badge</span>
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>LRN</h4>
            <p style={{ margin: 0, fontFamily: "monospace", fontSize: "18px", fontWeight: 700, color: "var(--primary-navy)" }}>{student.id}</p>
          </div>
        </div>
        <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Grade / Section</h4>
            <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--primary-navy)" }}>{student.grade}</p>
          </div>
        </div>
      </div>

      <div style={{ background: "white", padding: "32px", borderRadius: "24px", border: "1px solid var(--border-light)", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--accent-teal)" }}>how_to_vote</span>
          <h3 style={{ margin: 0, fontSize: "20px" }}>Votes Cast</h3>
        </div>
        
        {votes.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", background: "#f8fafc", borderRadius: "16px", border: "2px dashed var(--border-light)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "#cbd5e1", marginBottom: "12px" }}>inbox</span>
            <p style={{ margin: 0, color: "var(--text-muted)", fontWeight: 500 }}>This student has not cast any votes yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {votes.map((vote) => (
              <div key={vote.id} style={{ padding: "16px 20px", background: "linear-gradient(145deg, #ffffff, #f8fafc)", borderRadius: "12px", border: "1px solid var(--border-light)", borderLeft: "4px solid var(--primary-navy)", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "default" }} className="hover-lift">
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Position</div>
                  <strong style={{ fontSize: "16px", color: "var(--primary-navy)" }}>{vote.candidate.position}</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Voted For</div>
                  <div style={{ fontWeight: 700, color: "var(--accent-teal)", fontSize: "16px" }}>{vote.candidate.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
