import svgPaths from "./svg-et7vc48xue";

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex gap-[20px] h-[100px] items-center relative w-[300px]"} data-name="logo">
      <div className="relative shrink-0 size-[100px]" data-name="mdi:pill-multiple">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <g id="mdi:pill-multiple">
            <path d={svgPaths.p25c57400} fill="var(--fill-0, #6D6D6D)" id="Vector" />
            <path d={svgPaths.p351cf370} fill="var(--fill-0, white)" id="Vector_2" />
          </g>
        </svg>
      </div>
      <p className="css-ew64yg font-['Hanken_Grotesk:Bold',sans-serif] font-bold leading-[80px] relative shrink-0 text-[65px] text-white">Pilliox</p>
    </div>
  );
}