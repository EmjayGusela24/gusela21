import React from "react";

const Footer: React.FC = () => {
  return (
    <footer style={{
      borderTop: "1px solid var(--border-light, #E2E8F0)",
      background: "var(--bg-card, #FFFFFF)",
      padding: "32px 24px",
      marginTop: "auto",
      color: "#475569",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        {/* Top Branding and Description Row */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "24px"
        }}>
          <div style={{ maxWidth: "500px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#0F172A" }}>
              <span className="material-symbols-outlined" style={{ color: "#2563EB", fontWeight: "bold" }}>verified</span>
              <strong style={{ fontSize: "16px", fontWeight: 700 }}>Student Voting System</strong>
            </div>
            <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#64748B" }}>
              A secure, transparent, and fully encrypted electronic voting platform designed for fair student government elections.
            </p>
          </div>

          {/* Action / Help Links Column */}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94A3B8", marginBottom: "12px" }}>
              Support Links
            </div>
            <a 
              href="#help-center" // Replace with your static URL or custom function route if needed
              style={{
                textDecoration: "none",
                color: "#2563EB",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>help</span>
              Help Center & FAQ
            </a>
          </div>
        </div>

        {/* Horizontal Divider Accent line */}
        <div style={{ height: "1px", background: "#F1F5F9" }} />

        {/* Bottom Compliance & Framework Badges */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          fontSize: "13px"
        }}>
          <div>
            <div style={{ fontWeight: 600, color: "#1E293B", marginBottom: "2px" }}>
              © 2026 Supreme Student Learners Government
            </div>
            <div style={{ color: "#94A3B8", display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#DC2626" }}>lock</span>
              All rights reserved. Unauthorized access is strictly prohibited.
            </div>
          </div>

          {/* Infrastructure Provider Credentials Badge */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#F8FAFC",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #E2E8F0",
            fontSize: "12px",
            fontWeight: 500,
            color: "#475569"
          }}>
            <span>Built with Supabase</span>
            <div style={{ width: "2px", height: "12px", background: "#CBD5E1" }} />
            <span style={{ color: "#10B981", fontWeight: "bold" }}>Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
