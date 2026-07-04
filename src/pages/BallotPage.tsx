import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Student, Candidate, Page, POSITIONS } from "../types";
import { base64ToImageUrl } from "../utils/imageUtils";
import { CountdownTimer } from "../components/CountdownTimer";

const BallotPage: React.FC<{
  setPage: (p: Page) => void;
  currentUser: Student;
}> = ({ setPage, currentUser }) => {
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  useEffect(() => {
    const checkVotingStatus = async () => {
      if (currentUser.has_voted) {
        setPage("confirm");
        return;
      }

      const { data: studentData } = await supabase
        .from("students")
        .select("has_voted")
        .eq("id", currentUser.id)
        .single();

      if (studentData?.has_voted) {
        setPage("confirm");
        return;
      }

      const { data: existingVotes } = await supabase
        .from("votes")
        .select("id")
        .eq("student_id", currentUser.id)
        .limit(1);

      if (existingVotes && existingVotes.length > 0) {
        setPage("confirm");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("candidates")
        .select("*");

      if (fetchError) {
        setError("Error fetching candidates: " + fetchError.message);
        setCandidates([]);
      } else {
        setCandidates((data || []) as Candidate[]);
      }

      setLoading(false);
    };

    checkVotingStatus();
  }, [currentUser.id, setPage, currentUser.has_voted]);

  const handleSubmit = async () => {
    if (isTimerExpired) {
      setError("The election deadline has passed. You can no longer submit your ballot.");
      return;
    }

    const missingPositions = POSITIONS.filter((pos) => !selectedCandidates[pos]);
    if (missingPositions.length > 0) {
      setError(`Please select one candidate for each position. Missing: ${missingPositions.join(", ")}`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Direct database cutoff validation check
      const { data: settings, error: settingsError } = await supabase
        .from("election_settings")
        .select("end_time")
        .eq("id", 1)
        .maybeSingle();

      if (!settingsError && settings?.end_time) {
        if (new Date() >= new Date(settings.end_time)) {
          setError("The election deadline has passed. You can no longer submit your ballot.");
          setIsTimerExpired(true);
          setLoading(false);
          return;
        }
      }
      const { data: existingVotes } = await supabase
        .from("votes")
        .select("id")
        .eq("student_id", currentUser.id)
        .limit(1);

      if (existingVotes && existingVotes.length > 0) {
        setError("You have already voted.");
        setLoading(false);
        return;
      }

      const voteInserts = POSITIONS.map((position) => ({
        student_id: currentUser.id,
        candidate_id: selectedCandidates[position]!,
        position,
      }));

      const { error: voteError } = await supabase.from("votes").insert(voteInserts);
      if (voteError) throw voteError;

      await supabase.from("students").update({ has_voted: true }).eq("id", currentUser.id);

      const receiptId = Math.random().toString(36).substr(2, 12).toUpperCase();
      await supabase.from("receipts").insert([
        {
          student_id: currentUser.id,
          receipt_id: receiptId,
          timestamp: new Date().toISOString(),
          student_name: currentUser.name,
          grade: currentUser.grade,
        },
      ]);

      localStorage.setItem(
        "currentUser",
        JSON.stringify({ ...currentUser, has_voted: true })
      );

      setPage("confirm");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      setError("Unexpected error: " + message);
    } finally {
      setLoading(false);
    }
  };

  const grouped = POSITIONS.reduce<Record<string, Candidate[]>>((acc, pos) => {
    acc[pos] = candidates.filter((c) => c.position === pos);
    return acc;
  }, {});

  const totalPositions = POSITIONS.length;
  const selectedCount = Object.keys(selectedCandidates).length;
  const allSelected = selectedCount === totalPositions;
  const incompletePositions = POSITIONS.filter((pos) => !selectedCandidates[pos]);

  if (loading) return <div className="screen-content flex-center">Loading ballot...</div>;

  return (
    <div className="screen-content content-max-width">
      {/* Real-time Countdown Banner */}
      <CountdownTimer
        onExpire={() => setIsTimerExpired(true)}
        onTimerLoaded={(endTime) => {
          if (endTime) {
            setIsTimerExpired(new Date() >= new Date(endTime));
          } else {
            setIsTimerExpired(false);
          }
        }}
      />

      {isTimerExpired && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FEE2E2",
            borderRadius: "12px",
            padding: "16px 24px",
            color: "#EF4444",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(239, 68, 68, 0.05)"
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#EF4444" }}>
            gavel
          </span>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#991B1B" }}>ELECTION HAS OFFICIALLY ENDED</h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#B91C1C" }}>
              The cutoff deadline has been reached. Ballot submissions and candidate selections are now locked.
            </p>
          </div>
        </div>
      )}

      <div
        className="dashboard-header-flex"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "20px"
        }}
      >
        <div>
          <span className="overline">Phase 2: Electronic Ballot</span>
          <h1 style={{ margin: 0 }}>Official Voting Ballot</h1>
          <p style={{ margin: "6px 0 0 0" }}>
            Welcome, <strong>{currentUser.name}</strong> ({currentUser.grade}). You must select{" "}
            <strong>one candidate per position</strong>.
          </p>
        </div>
        <div className="dashboard-logos">
          <img
            src="/image.png"
            alt="Logo 1"
            className="dashboard-logo-img"
          />
          <img
            src="/image copy.png"
            alt="Logo 2"
            className="dashboard-logo-img"
          />
        </div>
      </div>

      <div className="card-box" style={{ marginBottom: "24px", background: "var(--bg-main)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0 }}>Voting Progress</h3>
          <span className={`badge-${allSelected ? "accent-teal" : "light-blue"}`}>
            {selectedCount}/{totalPositions} Selected
          </span>
        </div>

        <div style={{ background: "#E2E8F0", borderRadius: "8px", height: "12px", marginBottom: "16px", overflow: "hidden" }}>
          <div
            style={{
              background: allSelected ? "#10B981" : "#3B82F6",
              height: "100%",
              width: `${(selectedCount / totalPositions) * 100}%`,
              borderRadius: "8px",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
          {POSITIONS.map((pos) => {
            const isSelected = !!selectedCandidates[pos];
            return (
              <div
                key={pos}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  background: isSelected ? "#ECFDF5" : "#FEF3F2",
                  borderRadius: "6px",
                  border: `1px solid ${isSelected ? "#10B981" : "#FECACA"}`,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "18px",
                    color: isSelected ? "#10B981" : "#EF4444",
                  }}
                >
                  {isSelected ? "check_circle" : "radio_button_unchecked"}
                </span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: isSelected ? "#065F46" : "#991B1B" }}>
                  {pos}: {isSelected ? "✓" : "Missing"}
                </span>
              </div>
            );
          })}
        </div>

        {!allSelected && (
          <p style={{ marginTop: "16px", fontSize: "13px", color: "#DC2626", fontWeight: 600 }}>
            ⚠️ Please complete all {incompletePositions.length} remaining position(s): {incompletePositions.join(", ")}
          </p>
        )}
        {allSelected && (
          <p style={{ marginTop: "16px", fontSize: "13px", color: "#059669", fontWeight: 600 }}>
            ✓ All positions selected! Ready to submit your vote.
          </p>
        )}
      </div>

      {error && (
        <div style={{ color: "#D92D20", background: "#FEF3F2", padding: "12px", borderRadius: "8px", fontSize: "12px", marginBottom: "24px", fontWeight: 600 }}>
          {error}
        </div>
      )}

      {POSITIONS.map((position) => {
        const posCandidates = grouped[position] || [];
        const selectedId = selectedCandidates[position];

        return (
          <div key={position} style={{ marginBottom: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ padding: "8px 16px", background: "var(--primary-navy)", color: "white", borderRadius: "8px", fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", boxShadow: "0 4px 12px rgba(11,23,54,0.15)" }}>
                {position}
              </div>
              <div style={{ height: "2px", flex: 1, background: "linear-gradient(90deg, var(--border-light), transparent)" }}></div>
            </div>
            
            <div className="candidate-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {posCandidates.map((c) => {
                const avatar = base64ToImageUrl(c.image_url) || `https://ui-avatars.com/api/?name=${c.name}&background=E8F0FE&color=0B1736`;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (isTimerExpired) return;
                      setSelectedCandidates((prev) => ({ ...prev, [position]: c.id }));
                    }}
                    className={`candidate-card ${selectedId === c.id ? "selected" : ""} touch-animate`}
                    style={{ height: "100%", opacity: isTimerExpired ? 0.6 : 1, cursor: isTimerExpired ? "not-allowed" : "pointer", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <img
                        src={avatar}
                        alt={c.name}
                        style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=E8F0FE&color=0B1736`; }}
                      />
                    </div>
                    <div style={{ textAlign: "center", marginTop: "12px", marginBottom: "8px" }}>
                      <h3 style={{ fontSize: "18px", margin: 0 }}>{c.name}</h3>
                    </div>
                    {c.campaign_text && (
                      <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "12px", marginTop: "auto" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCampaign(expandedCampaign === c.id ? null : c.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--primary-blue)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            margin: "0 auto",
                          }}
                        >
                          {expandedCampaign === c.id ? "Hide Campaign" : "View Campaign Platform"}
                          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            {expandedCampaign === c.id ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                        {expandedCampaign === c.id && (
                          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "12px", lineHeight: 1.6, textAlign: "center", wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>
                            {c.campaign_text}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="button-stack" style={{ marginTop: "32px" }}>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading || isTimerExpired}>
          {loading ? "Submitting Secure Ballot..." : isTimerExpired ? "Election Closed" : "Securely Submit All Votes"}
        </button>
      </div>
    </div>
  );
};

export default BallotPage;
