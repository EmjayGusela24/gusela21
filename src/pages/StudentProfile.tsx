import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Student, Page } from "../types";
import ReturnButton from "../components/ReturnButton";
import { base64ToImageUrl, generateInitialsAvatar } from "../utils/imageUtils";

const StudentProfile: React.FC<{
  setPage: (p: Page) => void;
  studentId: string;
}> = ({ setPage, studentId }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [votes, setVotes] = useState<{ id: string; candidate: { name: string; position: string }; voted_at?: string; location?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Resolved vote metadata: prefer student record, fall back to first vote row
  const [resolvedVotedAt, setResolvedVotedAt] = useState<string | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError("");

      // ── 1. Fetch student record (select * works even before SQL migration) ──
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

      // ── 2. Fetch votes — try with time/location columns, fall back if they don't exist yet ──
      let voteRows: any[] = [];
      const { data: votesFull, error: votesError } = await supabase
        .from("votes")
        .select("id, candidate_id, position, voted_at, location")
        .eq("student_id", studentId)
        .order("voted_at", { ascending: true });

      if (votesError) {
        // Columns may not exist yet — fall back to basic fetch
        const { data: votesBasic } = await supabase
          .from("votes")
          .select("id, candidate_id, position")
          .eq("student_id", studentId);
        voteRows = votesBasic || [];
      } else {
        voteRows = votesFull || [];
      }

      if (!voteRows || voteRows.length === 0) {
        setVotes([]);
        // Still resolve from student record if has_voted
        const studentVotedAt = (stuData as any).voted_at as string | null;
        const studentLocation = (stuData as any).vote_location as string | null;
        setResolvedVotedAt(studentVotedAt || null);
        setResolvedLocation(studentLocation || null);
        setLoading(false);
        return;
      }

      //    Step B: fetch the candidate names for those candidate IDs
      const candidateIds = [...new Set(voteRows.map((v: any) => v.candidate_id))];
      const { data: candidateRows } = await supabase
        .from("candidates")
        .select("id, name, position")
        .in("id", candidateIds);

      const candidateMap: Record<string, { name: string; position: string }> = {};
      (candidateRows || []).forEach((c: any) => {
        candidateMap[c.id] = { name: c.name, position: c.position };
      });

      const transformed = voteRows.map((vote: any) => ({
        id: vote.id,
        candidate: candidateMap[vote.candidate_id] || { name: "Unknown", position: vote.position || "" },
        voted_at: vote.voted_at as string | undefined,
        location: vote.location as string | undefined,
      }));

      setVotes(transformed);

      // ── 3. Resolve vote time & location: student record first, then fall back to votes ──
      const studentVotedAt = (stuData as any).voted_at as string | null;
      const studentLocation = (stuData as any).vote_location as string | null;
      const firstVote = transformed[0];

      setResolvedVotedAt(studentVotedAt || firstVote?.voted_at || null);
      setResolvedLocation(
        studentLocation && studentLocation !== "Location unavailable"
          ? studentLocation
          : firstVote?.location && firstVote.location !== "Location unavailable"
          ? firstVote.location
          : studentLocation || firstVote?.location || null
      );

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
                base64ToImageUrl(student.photo || student.photo_url) || generateInitialsAvatar(student.name)
              }
              alt={student.name}
              style={{ width: "80px", height: "80px", borderRadius: "20px", objectFit: "cover", border: "2px solid var(--border-light)", boxShadow: "0 8px 16px rgba(0,0,0,0.08)" }}
              onError={(e) => { e.currentTarget.src = generateInitialsAvatar(student.name); }}
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

      {/* Vote Activity Banner — only shown when student has voted */}
      {student.has_voted && (resolvedVotedAt || resolvedLocation) && (
        <div style={{
          background: "linear-gradient(135deg, #0B1736 0%, #1E2B4F 100%)",
          borderRadius: "20px",
          padding: "20px 28px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          boxShadow: "0 8px 32px rgba(11,23,54,0.18)",
        }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ color: "#34d399", fontSize: "24px" }}>verified</span>
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Vote Activity</div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {resolvedVotedAt && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "white" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#93c5fd" }}>schedule</span>
                  {new Date(resolvedVotedAt).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                </span>
              )}
              {resolvedLocation && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "white" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#86efac" }}>location_on</span>
                  {resolvedLocation}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        {/* LRN */}
        <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f1f5f9", color: "#475467", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined">badge</span>
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>LRN</h4>
            <p style={{ margin: 0, fontFamily: "monospace", fontSize: "17px", fontWeight: 700, color: "var(--primary-navy)" }}>{student.id}</p>
          </div>
        </div>

        {/* Grade */}
        <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined">school</span>
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Grade Level</h4>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--primary-navy)" }}>{student.grade}</p>
          </div>
        </div>

        {/* Section */}
        <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f3e8ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Section</h4>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--primary-navy)" }}>
              {student.section ? student.section : <span style={{ color: "#94a3b8", fontStyle: "italic", fontWeight: 500, fontSize: "14px" }}>Not set</span>}
            </p>
          </div>
        </div>

        {/* Age */}
        <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid var(--border-light)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined">cake</span>
          </div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Age</h4>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--primary-navy)" }}>
              {student.age != null ? (
                <>{student.age} <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)" }}>yrs old</span></>
              ) : (
                <span style={{ color: "#94a3b8", fontStyle: "italic", fontWeight: 500, fontSize: "14px" }}>Not set</span>
              )}
            </p>
          </div>
        </div>

        {/* Voted At */}
        <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: `1px solid ${resolvedVotedAt ? "#bfdbfe" : "var(--border-light)"}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Vote Time</h4>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--primary-navy)", wordBreak: "break-word" }}>
              {resolvedVotedAt
                ? new Date(resolvedVotedAt).toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
                : <span style={{ color: "#94a3b8", fontStyle: "italic", fontWeight: 500, fontSize: "14px" }}>Not yet voted</span>}
            </p>
          </div>
        </div>

        {/* Vote Location */}
        <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: `1px solid ${resolvedLocation && resolvedLocation !== "Location unavailable" ? "#bbf7d0" : "var(--border-light)"}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f0fdf4", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-outlined">location_on</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Vote Location</h4>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--primary-navy)", wordBreak: "break-all", lineHeight: "1.4" }}>
              {resolvedLocation
                ? <>{resolvedLocation}{resolvedLocation !== "Location unavailable" && (<><br /><a href={`https://maps.google.com/?q=${encodeURIComponent(resolvedLocation.split(" (")[0])}`} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>View on Maps ↗</a></>)}</>
                : <span style={{ color: "#94a3b8", fontStyle: "italic", fontWeight: 500, fontSize: "14px" }}>Not yet voted</span>}
            </p>
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
            {votes.map((vote) => {
              const formattedTime = vote.voted_at
                ? new Date(vote.voted_at).toLocaleString("en-PH", {
                    year: "numeric", month: "short", day: "numeric",
                    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
                  })
                : null;
              return (
                <div key={vote.id} style={{ padding: "16px 20px", background: "linear-gradient(145deg, #ffffff, #f8fafc)", borderRadius: "12px", border: "1px solid var(--border-light)", borderLeft: "4px solid var(--primary-navy)", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "default" }} className="hover-lift">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Position</div>
                      <strong style={{ fontSize: "16px", color: "var(--primary-navy)" }}>{vote.candidate.position}</strong>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Voted For</div>
                      <div style={{ fontWeight: 700, color: "var(--accent-teal)", fontSize: "16px" }}>{vote.candidate.name}</div>
                    </div>
                  </div>
                  {(formattedTime || vote.location) && (
                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed var(--border-light)", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {formattedTime && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: "#475467", background: "#f1f5f9", padding: "4px 10px", borderRadius: "99px", border: "1px solid #e2e8f0" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>schedule</span>
                          {formattedTime}
                        </span>
                      )}
                      {vote.location && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: "#475467", background: "#f1f5f9", padding: "4px 10px", borderRadius: "99px", border: "1px solid #e2e8f0" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "13px" }}>location_on</span>
                          {vote.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
