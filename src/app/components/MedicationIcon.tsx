import { cn } from "./ui/utils";

export const MEDICATION_ICON_IDS = [
  "capsule",
  "rounded-square",
  "round",
  "split-round",
  "quartered-round",
  "diagonal-capsule",
  "hexagon",
] as const;

export type MedicationIconId = (typeof MEDICATION_ICON_IDS)[number];

interface MedicationIconProps {
  icon?: MedicationIconId;
  color?: string;
  className?: string;
}

export function MedicationIcon({
  icon = "capsule",
  color = "currentColor",
  className,
}: MedicationIconProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-4", className)}
      style={{ color }}
      aria-hidden="true"
    >
      {icon === "capsule" && (
        <>
          <path d="M7.875 15.864L15.375 8.36402C15.7255 8.02057 16.0043 7.61106 16.1956 7.15916C16.3868 6.70726 16.4865 6.22193 16.489 5.73125C16.4914 5.24057 16.3966 4.75426 16.21 4.30045C16.0234 3.84664 15.7486 3.43433 15.4016 3.08737C15.0547 2.7404 14.6424 2.46565 14.1886 2.27902C13.7348 2.09239 13.2484 1.99757 12.7578 2.00005C12.2671 2.00253 11.7818 2.10225 11.3299 2.29346C10.878 2.48467 10.4684 2.76356 10.125 3.11402L2.625 10.614C2.27454 10.9575 1.99565 11.367 1.80444 11.8189C1.61323 12.2708 1.51351 12.7561 1.51103 13.2468C1.50855 13.7375 1.60337 14.2238 1.79 14.6776C1.97664 15.1314 2.25138 15.5437 2.59835 15.8907C2.94532 16.2376 3.35763 16.5124 3.81144 16.699C4.26525 16.8856 4.75155 16.9805 5.24223 16.978C5.73291 16.9755 6.21824 16.8758 6.67014 16.6846C7.12204 16.4934 7.53155 16.2145 7.875 15.864Z" stroke="currentColor" strokeWidth="1.03906" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 7L11 12" stroke="currentColor" strokeWidth="1.03906" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {icon === "rounded-square" && (
        <rect x="1.5" y="1.5" width="14.6" height="14.6" rx="3.5" stroke="currentColor" />
      )}
      {icon === "round" && (
        <rect x="1.5" y="1.5" width="14.6" height="14.6" rx="7.3" stroke="currentColor" />
      )}
      {icon === "split-round" && (
        <>
          <rect x="1.5" y="1.5" width="14.6" height="14.6" rx="7.3" stroke="currentColor" />
          <path d="M8.71231 2L9 16" stroke="currentColor" strokeWidth="1.03906" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {icon === "quartered-round" && (
        <>
          <rect x="1.5" y="1.5" width="14.6" height="14.6" rx="7.3" stroke="currentColor" />
          <path d="M8.71231 2L9 16" stroke="currentColor" strokeWidth="1.03906" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1.85616 9.14404L15.8562 8.85635" stroke="currentColor" strokeWidth="1.03906" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {icon === "diagonal-capsule" && (
        <rect x="11.7279" y="-0.292893" width="10" height="17" rx="5" transform="rotate(45 11.7279 -0.292893)" stroke="currentColor" />
      )}
      {icon === "hexagon" && (
        <path d="M8.25 1.01074C8.7141 0.742793 9.2859 0.742793 9.75 1.01074L15.5439 4.35547C16.0079 4.62335 16.2938 5.11855 16.2939 5.6543V12.3457C16.2938 12.8814 16.0079 13.3766 15.5439 13.6445L9.75 16.9893C9.2859 17.2572 8.7141 17.2572 8.25 16.9893L2.45605 13.6445C1.99207 13.3766 1.7062 12.8814 1.70605 12.3457V5.6543C1.7062 5.11855 1.99207 4.62335 2.45605 4.35547L8.25 1.01074Z" stroke="currentColor" />
      )}
    </svg>
  );
}
