import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { base64ToImageUrl, generateInitialsAvatar } from "../utils/imageUtils";

interface StudentPhotoProps {
  studentId: string;
  name: string;
  size?: number;
}

export const StudentPhoto: React.FC<StudentPhotoProps> = ({ studentId, name, size = 56 }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchPhoto = async () => {
      // Check session cache first for instant retrieval
      const cached = sessionStorage.getItem(`photo_${studentId}`);
      if (cached) {
        if (active) {
          setPhotoUrl(cached);
          setLoading(false);
        }
        return;
      }

      // Fetch only the photo columns for this single student id
      const { data, error } = await supabase
        .from("students")
        .select("photo, photo_url")
        .eq("id", studentId)
        .single();

      if (active) {
        // Prefer photo_url (text column — stores data URL directly, no decoding needed)
        // Fall back to photo (bytea hex — needs base64ToImageUrl to decode)
        const rawPhoto = data?.photo_url || data?.photo;
        if (!error && rawPhoto) {
          const url = base64ToImageUrl(rawPhoto);
          if (url) {
            try {
              sessionStorage.setItem(`photo_${studentId}`, url);
            } catch (e) {
              // Ignore session storage capacity errors
            }
            setPhotoUrl(url);
          }
        }
        setLoading(false);
      }
    };

    fetchPhoto();
    return () => {
      active = false;
    };
  }, [studentId]);

  return (
    <img
      src={photoUrl || generateInitialsAvatar(name)}
      alt={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "16px",
        objectFit: "cover",
        border: "2px solid white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        transition: "opacity 0.2s ease-in-out",
        opacity: loading ? 0.6 : 1,
      }}
      onError={(e) => {
        e.currentTarget.src = generateInitialsAvatar(name);
      }}
    />
  );
};
