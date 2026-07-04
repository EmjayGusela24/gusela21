import React, { useState, useEffect, useRef } from "react";
import { User } from "../types";
import { translations, LanguageCode } from "../utils/translations";

interface MenuProps {
  currentUser: User | null;
  handleLogout: () => void;
}

type ModalType = "process" | "rules" | "privacy" | "terms";

const Menu: React.FC<MenuProps> = ({ currentUser, handleLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("app_lang");
    return (saved === "en" || saved === "tl" || saved === "ceb" ? saved : "en") as LanguageCode;
  });

  const [activeModalType, setActiveModalType] = useState<ModalType | null>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (activeModalType) {
      const modalWidth = 380;
      const modalHeight = 420;
      const centeredX = Math.max(20, (window.innerWidth - modalWidth) / 2);
      const centeredY = Math.max(20, (window.innerHeight - modalHeight) / 2);
      setPosition({ x: centeredX, y: centeredY });
    }
  }, [activeModalType]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".close-btn")) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const changeLanguage = (newLang: LanguageCode) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
    window.dispatchEvent(new Event("languageChange"));
  };

  const t = translations[lang];

  const getSessionLabels = (l: LanguageCode) => {
    switch (l) {
      case "tl":
        return { loggedInAs: "Naka-log in bilang", logout: "Mag-logout" };
      case "ceb":
        return { loggedInAs: "Naka-log in isip", logout: "Mag-logout" };
      default:
        return { loggedInAs: "Logged in as", logout: "Logout" };
    }
  };

  const sessionLabels = getSessionLabels(lang);

  const modalConfig: Record<ModalType, { title: string; content: string; icon: string }> = {
    process: { title: t.electionProcessTitle || "Election Process", content: t.electionProcessContent, icon: "how_to_vote" },
    rules: { title: t.votingRulesTitle || "Official Voting Rules", content: t.votingRulesContent, icon: "gavel" },
    privacy: { title: t.privacyPolicyTitle || "Privacy & Data Policy", content: t.privacyPolicyContent, icon: "shield" },
    terms: { title: t.termsOfServiceTitle || "Terms of Service", content: t.termsOfServiceContent, icon: "description" },
  };

  const handleAboutClick = (type: ModalType) => {
    setIsOpen(false);
    setActiveModalType(type);
  };

  /**
   * Universally formats paragraphs across ALL languages into styled left-border cards.
   */
  const renderUnifiedBlockContent = (type: ModalType, text: string) => {
    if (!text) return null;

    const lines = text.split("\n")
      .map(line => {
        let clean = line.trim();
        // Regex strips prefix numbers (1., 2.), list hyphens (-), bullets (•) or asterisks (*) smoothly
        clean = clean.replace(/^(\d+[\.\)]|[-*•])\s*/, "");
        return clean;
      })
      .filter(line => line.length > 0);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {lines.map((line, i) => {
          let theme = { bg: "#F8FAFC", border: "#94A3B8", text: "#334155" };

          if (type === "rules") {
            const ruleThemes = [
              { bg: "#F8FAFC", border: "#94A3B8", text: "#334155" },
              { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
              { bg: "#FEF2F2", border: "#FEE2E2", text: "#991B1B" }
            ];
            theme = ruleThemes[i % ruleThemes.length];
          } else if (type === "process") {
            const processThemes = [
              { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
              { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534" },
              { bg: "#F5F3FF", border: "#DDD6FE", text: "#5B21B6" }
            ];
            theme = processThemes[i % processThemes.length];
          } else if (type === "privacy") {
            const privacyThemes = [
              { bg: "#F0FDFA", border: "#99F6E4", text: "#115E59" },
              { bg: "#F8FAFC", border: "#CBD5E1", text: "#334155" }
            ];
            theme = i === 0 ? privacyThemes[0] : privacyThemes[1];
          } else if (type === "terms") {
            const termsThemes = [
              { bg: "#FFFBEB", border: "#FEF3C7", text: "#92400E" },
              { bg: "#F8FAFC", border: "#CBD5E1", text: "#334155" }
            ];
            theme = i === 0 ? termsThemes[0] : termsThemes[1];
          }

          return (
            <div
              key={i}
              style={{
                backgroundColor: theme.bg,
                borderLeft: `4px solid ${theme.border}`,
                padding: "12px 14px",
                borderRadius: "0 8px 8px 0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
              }}
            >
              <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.5", color: theme.text, textAlign: "left" }}>
                {line}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const activeModalDetails = activeModalType ? modalConfig[activeModalType] : null;

  return (
    <div className="dropdown-container" ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`dropdown-trigger ${isOpen ? "active" : ""}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined">menu</span>
        <span className="material-symbols-outlined chevron">expand_more</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {/* Language Selector */}
          <div className="lang-selector-pill">
            {["en", "tl", "ceb"].map((l) => (
              <button
                key={l}
                onClick={() => changeLanguage(l as LanguageCode)}
                className={`lang-btn ${lang === l ? "active" : ""}`}
              >
                {l === "en" ? "English" : l === "tl" ? "Tagalog" : "Bisaya"}
              </button>
            ))}
          </div>

          {/* Contact Section */}
          <div className="dropdown-section">
            <div className="dropdown-section-label">{t.contactSectionTitle}</div>
            <div className="dropdown-list">
              <a href="https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=emjaygusela@gmail.com" target="_blank" rel="noopener noreferrer" className="dropdown-item">
                <span className="material-symbols-outlined dropdown-item-icon">mail</span>
                <span>admin@gmail.com</span>
              </a>
              <a href="tel:09168562198" className="dropdown-item">
                <span className="material-symbols-outlined dropdown-item-icon">call</span>
                <span>09168562198</span>
              </a>
              <a href="https://www.google.com/maps/place/Domingo+Ledesma+Mapa+High+School" target="_blank" rel="noopener noreferrer" className="dropdown-item">
                <span className="material-symbols-outlined dropdown-item-icon">location_on</span>
                <span>{t.addressValue}</span>
              </a>
            </div>
          </div>

          {/* About Section */}
          <div className="dropdown-section">
            <div className="dropdown-section-label">{t.aboutSectionTitle || "About"}</div>
            <div className="dropdown-list">
              <button onClick={() => handleAboutClick("process")} className="dropdown-item">
                <span className="material-symbols-outlined dropdown-item-icon">how_to_vote</span>
                <span>{t.electionProcess || "Election Process"}</span>
              </button>
              <button onClick={() => handleAboutClick("rules")} className="dropdown-item">
                <span className="material-symbols-outlined dropdown-item-icon">gavel</span>
                <span>{t.votingRules || "Official Voting Rules"}</span>
              </button>
              <button onClick={() => handleAboutClick("privacy")} className="dropdown-item">
                <span className="material-symbols-outlined dropdown-item-icon">shield</span>
                <span>{t.privacyPolicy || "Privacy & Data Policy"}</span>
              </button>
              <button onClick={() => handleAboutClick("terms")} className="dropdown-item">
                <span className="material-symbols-outlined dropdown-item-icon">description</span>
                <span>{t.termsOfService || "Terms of Service"}</span>
              </button>
            </div>
          </div>

          {/* Session Data Handling */}
          {currentUser && (
            <div className="dropdown-section">
              <div className="dropdown-user-row">
                <span className="material-symbols-outlined dropdown-user-avatar">account_circle</span>
                <span className="dropdown-user-name">
                  {sessionLabels.loggedInAs}: {currentUser.name}
                </span>
              </div>
              <div className="dropdown-list">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="dropdown-item logout-btn"
                >
                  <span className="material-symbols-outlined dropdown-item-icon">logout</span>
                  <span>{sessionLabels.logout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Freely Draggable Framed Screen Portal */}
      {activeModalType && activeModalDetails && (
        <div
          style={{
            position: "fixed",
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: "380px",
            background: "#FFFFFF",
            borderRadius: "16px",
            boxShadow: "0px 20px 50px rgba(15, 23, 42, 0.22)",
            border: "1px solid #E2E8F0",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            userSelect: isDragging ? "none" : "auto"
          }}
        >
          {/* Draggable Header Handle */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "16px 20px",
              background: "#F8FAFC",
              borderBottom: "1px solid #E2E8F0",
              cursor: isDragging ? "grabbing" : "grab",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "#1E3A8A" }}>
              {activeModalDetails.icon}
            </span>
            <h3 style={{ margin: "0", fontSize: "15px", fontWeight: 600, color: "#0F172A", flex: 1 }}>
              {activeModalDetails.title}
            </h3>
            <button
              className="close-btn"
              onClick={() => setActiveModalType(null)}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#94A3B8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px"
              }}
            >
              ×
            </button>
          </div>

          {/* Scrolling Block Card Layout Container */}
          <div style={{ padding: "20px", maxHeight: "320px", overflowY: "auto", background: "#FFFFFF" }}>
            {renderUnifiedBlockContent(activeModalType, activeModalDetails.content)}
          </div>

          {/* Footer Close Actions Bar */}
          <div style={{ padding: "14px 20px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC" }}>
            <button
              onClick={() => setActiveModalType(null)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#0F172A",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13.5px",
                cursor: "pointer"
              }}
            >
              {t.closeButton || "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;