// Lucide has no 3D-printer icon (its Printer is a paper printer): lucide's Box cube plus one
// layer line across its sides, for "3D" and "printed in layers". Same 24px grid and round caps
// as lucide, so it takes the same size / strokeWidth props and sits beside lucide icons.
export function PrintIcon({ size = 24, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
      <path d="m3 12 9 5 9-5" />
    </svg>
  );
}
