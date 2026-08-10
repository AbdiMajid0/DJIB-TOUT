"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomLevel?: number;
}

export default function ImageZoom({ src, alt, className = "", zoomLevel = 2 }: ImageZoomProps) {
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomPos({ x, y });
  };

  const handleMouseEnter = () => setShowZoom(true);
  const handleMouseLeave = () => setShowZoom(false);

  // If the src is an emoji or fallback (like from DataSeeder), we don't zoom
  const isEmoji = src && src.length < 10 && !src.startsWith("http") && !src.startsWith("/");
  
  if (isEmoji) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
        <span className="text-6xl">{src}</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden cursor-crosshair group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Base Image */}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-contain"
      />
      
      {/* Zoom Lens overlay (Only visible on hover) */}
      {showZoom && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 hidden md:block"
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundRepeat: "no-repeat",
            backgroundColor: "white",
          }}
        />
      )}
    </div>
  );
}
