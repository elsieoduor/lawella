"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProductVisualProps {
  product: {
    image_url?: string;
    emoji?: string;
    name: string;
  };
  size?: number;
  className?: string;
}

export function ProductVisual({ product, size = 300, className }: ProductVisualProps) {
  const hasImage = !!product.image_url;

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center transition-transform duration-500 hover:scale-105",
        className
      )}
      style={{ width: size, height: size }}
    >
      {hasImage ? (
        <Image
          src={product.image_url!}
          alt={product.name}
          fill
          priority
          className="object-contain drop-shadow-2xl animate-float"
          unoptimized // Useful if Supabase optimization isn't configured yet
        />
      ) : (
        <div 
          className="font-display animate-float select-none"
          style={{ fontSize: size * 0.6 }}
        >
          {product.emoji || "🧶"}
        </div>
      )}
    </div>
  )
}