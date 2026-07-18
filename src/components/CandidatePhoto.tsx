import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { base64ToImageUrl, generateInitialsAvatar } from "../utils/imageUtils";

interface CandidatePhotoProps {
  candidateId: string;
  name: string;
  size?: number;
  borderRadius?: string;
}

export const CandidatePhoto: React.FC<CandidatePhotoProps> = ({
  candidateId,
  name,
  size = 56,
  borderRadius = "50%",
}) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchPhoto = async () => {
      // Check session cache first for instant retrieval
      const cacheKey = `candidate_photo_${candidateId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        if (active) {
          setPhotoUrl(cached);
          setLoading(false);
        }
        return;
      }

      // Fetch only the image column for this single candidate
      const { data, error } = await supabase
        .from("candidates")
        .select("image")
        .eq("id", candidateId)
        .single();

      if (active) {
        if (!error && data?.image) {
          const url = base64ToImageUrl(data.image);
          if (url) {
            try {
              sessionStorage.setItem(cacheKey, url);
            } catch {
              // Ignore sessionStorage quota errors
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
  }, [candidateId]);

  return (
    <img
      src={photoUrl || generateInitialsAvatar(name)}
      alt={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius,
        objectFit: "cover",
        border: "2px solid white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        flexShrink: 0,
        transition: "opacity 0.25s ease",
        opacity: loading ? 0.6 : 1,
      }}
      onError={(e) => {
        e.currentTarget.src = generateInitialsAvatar(name);
      }}
    />
  );
};
