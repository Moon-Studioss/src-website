// ─── Reference code generator ────────────────────────────────────
// Format: SRC-XXXX where X is uppercase alphanumeric
// e.g. SRC-7K2M, SRC-A4BQ

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I to avoid confusion

export function generateRefCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return `SRC-${code}`;
}

// ─── Urgency helpers ─────────────────────────────────────────────
export type UrgencyLevel = "overdue" | "critical" | "normal" | "comfortable";

export function getUrgency(deadlineStr: string): UrgencyLevel {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr);
  deadline.setHours(0, 0, 0, 0);
  const days = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0)   return "overdue";
  if (days <= 7)  return "critical";
  if (days <= 30) return "normal";
  return "comfortable";
}

export function getDaysLeft(deadlineStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDaysLeft(deadlineStr: string): string {
  const days = getDaysLeft(deadlineStr);
  if (days < 0)  return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `${days} days left`;
}

// ─── Status helpers ───────────────────────────────────────────────
export const STATUS_LABELS: Record<string, string> = {
  new:       "New",
  reviewing: "Reviewing",
  accepted:  "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  rejected:  "Rejected",
};

export const CATEGORY_LABELS: Record<string, string> = {
  web:      "Web App",
  app:      "Mobile App",
  ml:       "ML / AI",
  iot:      "IoT",
  software: "Desktop Software",
  unsure:   "Not Sure",
};

export const BUDGET_LABELS: Record<string, string> = {
  "under-1500":   "Under ₹1,500",
  "1500-3000":    "₹1,500 – ₹3,000",
  "3000-6000":    "₹3,000 – ₹6,000",
  "6000-10000":   "₹6,000 – ₹10,000",
  "10000-plus":   "₹10,000+",
  "not-sure":     "Not sure yet",
};

// ─── Store prices are stored in paise ────────────────────────────
export function formatPrice(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
