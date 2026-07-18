import React from "react";
import "./ConfirmationScreen.css";


const ConfirmationScreen: React.FC<{ handleLogout: () => void }> = ({ handleLogout }) => (
  <div className="screen-content flex-center" style={{ minHeight: "calc(100vh - 180px)", padding: "20px" }}>
    <div
      style={{
        maxWidth: "520px",
        width: "100%",
        margin: "0 auto",
        padding: "50px 40px",
        textAlign: "center",
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
      }}
    >
      <div style={{ marginBottom: "28px" }}>
        <span
          className="material-symbols-outlined success-icon"
          style={{ fontSize: "78px", color: "#10b981", background: "#ecfdf5", padding: "20px", borderRadius: "50%" }}
        >
          task_alt
        </span>
      </div>
      <h2 style={{ marginBottom: "14px", fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>
        You have voted successfully!
      </h2>
      <p style={{ marginBottom: "40px", fontSize: "16px", lineHeight: "1.6", color: "#475467", maxWidth: "380px", marginLeft: "auto", marginRight: "auto" }}>
        Your vote has been recorded. Thank you for participating in the election.
      </p>
      <button className="btn-primary" onClick={handleLogout} style={{ width: "100%", padding: "14px" }}>
        Logout
      </button>
    </div>
  </div>
);

export default ConfirmationScreen;
