"use client";

import { useState } from "react";
import Image from "next/image";
import { ENTITY_TYPE_GRADIENTS } from "@/app/lib/colors";
import type { EntityType } from "@/app/lib/types";

interface EntityAvatarProps {
  initials: string;
  type: EntityType;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
};

export function EntityAvatar({ initials, type, imageUrl, size = "md" }: EntityAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const gradient = ENTITY_TYPE_GRADIENTS[type] || ENTITY_TYPE_GRADIENTS.individual;
  const showImage = imageUrl && !imgError;

  return (
    <div
      className={`${sizeClasses[size]} ${showImage ? "" : `bg-gradient-to-br ${gradient}`} relative flex items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-lg`}
    >
      {showImage ? (
        <Image
          src={imageUrl}
          alt={initials}
          fill
          className="object-cover"
          sizes={size === "lg" ? "80px" : size === "md" ? "48px" : "32px"}
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
