import React, { useEffect, useState } from "react";
import logoDark from "../../assets/LogoDark.svg";
import logoLight from "../../assets/LogoLight.svg";

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "h-[32px] w-auto", alt = "Pilliox" }: LogoProps) {
  // Track if dark mode is actually applied to the document
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check initial state
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for changes to the html element's class
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Use PNG logos that switch based on applied dark mode
  const logoSrc = isDark ? logoDark : logoLight;
  
  return (
    <img 
      src={logoSrc} 
      alt={alt}
      className={className}
    />
  );
}