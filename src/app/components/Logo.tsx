import React, { useEffect, useState } from "react";
import logoLight from "../../assets/8a6609da19e33c9cb01930656c8f65f228118571.png";
import logoDark from "../../assets/204393461263049c2f30de2d3b17be3a2d9cddd4.png";

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "h-[40px] w-auto", alt = "Pilliox" }: LogoProps) {
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