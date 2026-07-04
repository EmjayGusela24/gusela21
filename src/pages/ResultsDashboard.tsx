import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import type { Candidate, User, Page } from "../types";
import { base64ToImageUrl } from "../utils/imageUtils";
import ReturnButton from "../components/ReturnButton";

const ResultsDashboard: React.FC<{ currentUser: User | null; setPage: (p: Page) => void }> = ({
  currentUser,
  setPage,
}) => {
  const [results, setResults] = useState<{ candidate: Candidate; count: number }[]>([]);
  const [stats, setStats] = useState({ totalRegistered: 0, totalVotesCast: 0, uniqueVoters: 0 });

  useEffect(() => {
    const fetchResults = async () => {
      const [candidatesRes, votesRes, studentsRes] = await Promise.all([
        supabase.from("candidates").select("*"),
        supabase.from("votes").select("candidate_id, student_id"),
        supabase.from("students").select("id", { count: "exact" }),
      ]);

      const candidates = (candidatesRes.data || []) as Candidate[];
      const votes = (votesRes.data || []) as any[];
      const totalRegistered = studentsRes.count || 0;

      const tally = candidates
        .map((c) => ({
          candidate: c,
          count: votes.filter((v) => v.candidate_id === c.id).length,
        }))
        .sort((a, b) => b.count - a.count);

      const uniqueVoters = new Set(votes.map((v) => v.student_id).filter(Boolean)).size;

      setResults(tally);
      setStats({ totalRegistered, totalVotesCast: votes.length, uniqueVoters });
    };

    fetchResults();
  }, []);

  const turnoutPercent = stats.totalRegistered > 0 ? Math.round((stats.uniqueVoters / stats.totalRegistered) * 100) : 0;

  const isAdmin = currentUser && "isAdmin" in currentUser && currentUser.isAdmin;
  const isStudent = currentUser && !isAdmin && "has_voted" in currentUser;

  return (
    <div className="screen-content content-max-width">
      <ReturnButton onClick={() => {
        if (isAdmin) setPage("admin_setup");
        // @ts-ignore
        else if (currentUser?.has_voted) setPage("confirm");
        else if (currentUser) setPage("ballot");
        else setPage("login");
      }} />
      <div className="flex-between" style={{ marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span className="overline">Current Happenings</span>
          <h1>Live Results Dashboard</h1>
          <div className="badge-cyan mt-1">
            <span className="live-dot"></span> Live Tabulation
          </div>
        </div>

        <div className="action-buttons" style={{ display: "flex", gap: "8px" }}>
          {isAdmin && (
            <>
              <button className="btn-outline-wide" onClick={() => setPage("admin_voters")} style={{ width: "auto", padding: "8px 16px" }}>
                Voters List
              </button>
              <button className="btn-outline-wide" onClick={() => setPage("admin_setup")} style={{ width: "auto", padding: "8px 16px" }}>
                Back to Setup
              </button>
            </>
          )}
          {isStudent && currentUser && (
            <div className="action-buttons" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {/* @ts-ignore */}
              {!currentUser.has_voted && (
                <button className="btn-light-blue" onClick={() => setPage("ballot")} style={{ width: "auto", padding: "8px 16px" }}>
                  Go to Ballot
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-box light relative-overflow">
          <span className="material-symbols-outlined watermark-icon">how_to_vote</span>
          <span className="overline">Total Votes Cast</span>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>{stats.totalVotesCast}</h2>
        </div>
        <div className="stat-box light">
          <span className="overline">Voter Turnout</span>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>{turnoutPercent}%</h2>
          <p className="mt-1" style={{ fontSize: "11px" }}>
            {stats.uniqueVoters} of {stats.totalRegistered} registered voters
          </p>
        </div>
      </div>

      <div style={{ background: "white", padding: "32px", borderRadius: "24px", border: "1px solid var(--border-light)", boxShadow: "0 10px 40px rgba(11,23,54,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--primary-navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(11,23,54,0.2)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>bar_chart</span>
          </div>
          <h3 style={{ margin: 0, fontSize: "24px", color: "var(--primary-navy)", fontWeight: 800 }}>Live Candidate Standings</h3>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {results.map((r) => {
            const percentage = stats.totalVotesCast > 0 ? Math.round((r.count / stats.totalVotesCast) * 100) : 0;
            const avatar = base64ToImageUrl(r.candidate.image_url) || `https://ui-avatars.com/api/?name=${r.candidate.name}&background=E8F0FE&color=0B1736`;

            return (
              <div key={r.candidate.id} style={{ padding: "20px 24px", background: "linear-gradient(145deg, #ffffff, #f8fafc)", borderRadius: "16px", border: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "20px", transition: "transform 0.2s ease, box-shadow 0.2s ease" }} className="hover-lift">
                <img 
                  src={avatar} 
                  alt={r.candidate.name} 
                  style={{ width: "64px", height: "64px", borderRadius: "16px", objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", border: "2px solid white" }} 
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(r.candidate.name)}&background=E8F0FE&color=0B1736`; }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 6px 0", fontSize: "18px", color: "var(--primary-navy)", fontWeight: 700 }}>{r.candidate.name}</h4>
                      <div style={{ display: "inline-block", padding: "4px 10px", background: "#e0f2fe", color: "#0284c7", borderRadius: "6px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {r.candidate.position}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "28px", color: "var(--primary-navy)", lineHeight: 1 }}>{r.count}</strong>
                      <span style={{ fontSize: "13px", color: "var(--text-muted)", marginLeft: "6px", fontWeight: 600 }}>votes</span>
                    </div>
                  </div>
                  <div style={{ background: "#f1f5f9", height: "10px", borderRadius: "5px", overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)" }}>
                    <div style={{ width: `${percentage}%`, background: "linear-gradient(90deg, #38bdf8, #3b82f6)", height: "100%", borderRadius: "5px", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
