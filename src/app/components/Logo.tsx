import React from "react";
import { useTheme } from "../hooks/useTheme";
import logoLight from "figma:asset/c7f6ea7f4e6f5e2f25d57077e0d2833d8bd1e23f.png";
import logoDark from "figma:asset/5dc8700fe5bf3e83dcdf5e2f2e79c370e6e943cd.png";

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "h-[40px] w-auto", alt = "Pilliox" }: LogoProps) {
  const { theme } = useTheme("system");
  
  // Use white logo for dark mode, colored logo for light mode
  const logoSrc = theme === "dark" ? logoDark : logoLight;
  
  return <img src={logoSrc} alt={alt} className={className} />;
}