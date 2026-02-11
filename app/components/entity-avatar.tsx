import { ENTITY_TYPE_GRADIENTS } from "@/app/lib/colors";
import type { EntityType } from "@/app/lib/types";

interface EntityAvatarProps {
  initials: string;
  type: EntityType;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
};

export function EntityAvatar({ initials, type, size = "md" }: EntityAvatarProps) {
  const gradient = ENTITY_TYPE_GRADIENTS[type] || ENTITY_TYPE_GRADIENTS.individual;

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${gradient} flex items-center justify-center rounded-full font-bold text-white shadow-lg`}
    >
      {initials}
    </div>
  );
}
