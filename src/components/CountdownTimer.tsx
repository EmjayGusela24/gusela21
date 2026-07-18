import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";

interface CountdownTimerProps {
  onExpire?: () => void;
  onTimerLoaded?: (endTime: string | null) => void;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  onExpire,
  onTimerLoaded,
  compact = false
}) => {
  const [endTime, setEndTime] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  } | null>(null);

  useEffect(() => {
    const fetchEndTime = async () => {
      const { data, error } = await supabase
        .from("election_settings")
        .select("end_time")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data) {
        setEndTime(data.end_time);
        if (onTimerLoaded) onTimerLoaded(data.end_time);
      }
    };

    fetchEndTime();

    // Subscribe to realtime database changes for election_settings
    const channel = supabase
      .channel("realtime-countdown")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "election_settings",
          filter: "id=eq.1"
        },
        (payload: any) => {
          const newEndTime = payload.new ? payload.new.end_time : null;
          setEndTime(newEndTime);
          if (onTimerLoaded) onTimerLoaded(newEndTime);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onTimerLoaded]);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(endTime) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        if (onExpire) onExpire();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        totalMs: difference
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  if (!endTime || !timeLeft) return null;

  const isExpired = timeLeft.totalMs <= 0;

  if (compact) {
    if (isExpired) {
      return (
        <span style={{ color: "#EF4444", fontWeight: 700 }}>
          Voting Closed
        </span>
      );
    }
    return (
      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#10B981" }}>
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ""}
        {String(timeLeft.hours).padStart(2, "0")}:
        {String(timeLeft.minutes).padStart(2, "0")}:
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
    );
  }

  // Premium detailed layout (centered & mobile responsive)
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        padding: "20px",
        background: isExpired ? "rgba(254, 242, 242, 0.95)" : "#FFFFFF",
        border: `1px solid ${isExpired ? "#FEE2E2" : "#E2E8F0"}`,
        borderRadius: "14px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        width: "100%",
        maxWidth: "450px",
        boxSizing: "border-box",
        margin: "0 auto 20px auto",
        transition: "all 0.3s ease",
        textAlign: "center"
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px"
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            color: isExpired ? "#EF4444" : "#0F172A",
            fontSize: "28px",
            animation: isExpired ? "none" : "pulse 2s infinite"
          }}
        >
          {isExpired ? "timer_off" : "schedule"}
        </span>
        <span
          style={{
            fontSize: "14px",
            letterSpacing: "0.05em",
            fontWeight: 700,
            color: isExpired ? "#991B1B" : "#475569"
          }}
        >
          {isExpired ? "ELECTION CLOSED" : "VOTING DEADLINE COUNTDOWN"}
        </span>
      </div>

      {!isExpired && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
          {timeLeft.days > 0 && (
            <>
              <div style={{ minWidth: "50px" }}>
                <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "monospace", color: "#000000", display: "block", lineHeight: "1" }}>
                  {timeLeft.days}
                </span>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", display: "block", marginTop: "4px" }}>DAYS</span>
              </div>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#CBD5E1", alignSelf: "flex-start", marginTop: "-2px" }}>:</span>
            </>
          )}
          <div style={{ minWidth: "50px" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "monospace", color: "#000000", display: "block", lineHeight: "1" }}>
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", display: "block", marginTop: "4px" }}>HRS</span>
          </div>
          <span style={{ fontSize: "24px", fontWeight: 800, color: "#CBD5E1", alignSelf: "flex-start", marginTop: "-2px" }}>:</span>
          <div style={{ minWidth: "50px" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "monospace", color: "#000000", display: "block", lineHeight: "1" }}>
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", display: "block", marginTop: "4px" }}>MINS</span>
          </div>
          <span style={{ fontSize: "24px", fontWeight: 800, color: "#CBD5E1", alignSelf: "flex-start", marginTop: "-2px" }}>:</span>
          <div style={{ minWidth: "50px" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, fontFamily: "monospace", color: "#000000", display: "block", lineHeight: "1" }}>
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748B", display: "block", marginTop: "4px" }}>SECS</span>
          </div>
        </div>
      )}
    </div>
  );
};