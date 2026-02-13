import svgPaths from "./svg-7i1ugmeb9t";
import lightLogo from "figma:asset/8b8f0e9c1ea8aecb447fa3fdf3be6669b8941f38.png";
import darkLogo from "figma:asset/279c4b4dd91c2aeda3938e1b868a9874fc6a66bc.png";

export default function Vector() {
  return (
    <div data-name="Vector" className="w-full h-full">
      {/* Light mode logo */}
      <img
        src={lightLogo}
        alt="Pilliox"
        className="block dark:hidden h-full object-contain"
      />
      {/* Dark mode logo */}
    
    </div>
  );
}