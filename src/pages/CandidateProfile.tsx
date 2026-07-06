import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import type { Candidate, Page } from "../types";
import ReturnButton from "../components/ReturnButton";
import { base64ToImageUrl } from "../utils/imageUtils";

const CandidateProfile: React.FC<{
  setPage: (p: Page) => void;
  candidateId: string;
}> = ({ setPage, candidateId }) => {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("candidates")
        .select("id, position, name, image_url, campaign_text, age, section")
        .eq("id", candidateId)
        .single();

      if (error || !data) {
        setCandidate(null);
        setLoading(false);
        return;
      }

      setCandidate(data as Candidate);

      const { count } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("candidate_id", candidateId);

      setVoteCount(count || 0);
      setLoading(false);
    };

    run();
  }, [candidateId]);

  if (loading) return <div className="screen-content flex-center">Loading candidate profile...</div>;
  if (!candidate) return <div className="screen-content flex-center">Candidate not found.</div>;

  const avatar =
    base64ToImageUrl(candidate.image_url) ||
    `https://ui-avatars.com/api/?name=${candidate.name}&background=E8F0FE&color=0B1736`;

  return (
    <div className="screen-content content-max-width">
      <ReturnButton onClick={() => setPage("admin_setup")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "32px", alignItems: "start" }}>
        <div style={{ textAlign: "center", padding: "48px 20px", background: "white", borderRadius: "24px", boxShadow: "0 10px 40px rgba(11,23,54,0.08)", position: "relative", overflow: "hidden", border: "1px solid var(--border-light)" }}>
          <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(11,23,54,0.03) 0%, rgba(11,23,54,0) 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "250px", height: "250px", background: "radial-gradient(circle, rgba(18,183,106,0.05) 0%, rgba(18,183,106,0) 70%)", borderRadius: "50%", pointerEvents: "none" }} />
          
          <img
            src={avatar}
            alt={candidate.name}
            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}&background=E8F0FE&color=0B1736`; }}
            style={{
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid white",
              boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
              marginBottom: "24px",
              position: "relative",
              zIndex: 1
            }}
          />
          <h1 style={{ color: "var(--primary-navy)", fontSize: "32px", marginBottom: "12px", position: "relative", zIndex: 1, letterSpacing: "-0.02em" }}>{candidate.name}</h1>
          <span className="badge-cyan" style={{ fontSize: "15px", padding: "8px 16px", position: "relative", zIndex: 1, fontWeight: 700, letterSpacing: "0.02em", display: "inline-block" }}>
            {candidate.position}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
            <div style={{ background: "linear-gradient(145deg, #ffffff, #f8fafc)", padding: "28px", borderRadius: "20px", border: "1px solid var(--border-light)", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "20px", transition: "transform 0.2s ease" }} className="hover-lift">
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>how_to_vote</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Total Votes</p>
                <h2 style={{ fontSize: "2.5rem", color: "var(--primary-navy)", margin: 0, lineHeight: 1 }}>{voteCount}</h2>
              </div>
            </div>
            
            <div style={{ background: "linear-gradient(145deg, #ffffff, #f8fafc)", padding: "28px", borderRadius: "20px", border: "1px solid var(--border-light)", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "20px", transition: "transform 0.2s ease" }} className="hover-lift">
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>military_tech</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Candidacy Position</p>
                <p style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--primary-navy)" }}>{candidate.position}</p>
              </div>
            </div>

            {candidate.age && (
              <div style={{ background: "linear-gradient(145deg, #ffffff, #f8fafc)", padding: "28px", borderRadius: "20px", border: "1px solid var(--border-light)", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "20px", transition: "transform 0.2s ease" }} className="hover-lift">
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>calendar_today</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Candidate Age</p>
                  <p style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--primary-navy)" }}>{candidate.age} Years Old</p>
                </div>
              </div>
            )}
            
            {candidate.section && (
              <div style={{ background: "linear-gradient(145deg, #ffffff, #f8fafc)", padding: "28px", borderRadius: "20px", border: "1px solid var(--border-light)", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", gap: "20px", transition: "transform 0.2s ease" }} className="hover-lift">
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#f3e8ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.5)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>school</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Candidate Section</p>
                  <p style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--primary-navy)" }}>{candidate.section}</p>
                </div>
              </div>
            )}
          </div>

          {candidate.campaign_text && (
            <div style={{ background: "white", padding: "32px", borderRadius: "20px", border: "1px solid var(--border-light)", boxShadow: "0 10px 40px rgba(11,23,54,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border-light)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--primary-navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>campaign</span>
                </div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--primary-navy)" }}>Campaign Platform & Biography</h3>
              </div>
              <div
                style={{
                  lineHeight: 1.85,
                  fontSize: "15px",
                  color: "#334155",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {candidate.campaign_text}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
