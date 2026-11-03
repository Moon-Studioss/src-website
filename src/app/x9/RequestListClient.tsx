"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDaysLeft, getUrgency, CATEGORY_LABELS, STATUS_LABELS, BUDGET_LABELS } from "@/lib/utils/helpers";
import { Trash2 } from "lucide-react";
import { toggleStar, deleteRequest, deleteAllRejectedRequests, deleteAllCompletedRequests } from "./actions";

type RequestData = any; // We can type this strictly later if needed

export function RequestListClient({ initialRequests, autoDeleteTimer }: { initialRequests: RequestData[], autoDeleteTimer: number }) {
  const [requests, setRequests] = useState<RequestData[]>(initialRequests);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<'rejected' | 'completed' | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingAllCompleted, setIsDeletingAllCompleted] = useState(false);

  const filtered = requests.filter(req => {
    if (filterStatus !== "all" && req.status !== filterStatus) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = 
        req.studentName.toLowerCase().includes(q) ||
        req.college.toLowerCase().includes(q) ||
        req.title.toLowerCase().includes(q) ||
        req.refCode.toLowerCase().includes(q) ||
        req.phone.toLowerCase().includes(q) ||
        req.email.toLowerCase().includes(q);
      if (!matches) return false;
    }
    
    return true;
  });

  const handleToggleStar = async (id: string, currentState: boolean) => {
    // Optimistic update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, starred: !currentState } : r));
    await toggleStar(id, !currentState);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    
    // Optimistic update
    setRequests(prev => prev.filter(r => r.id !== id));
    await deleteRequest(id);
  };

  const handleDeleteAllRejected = async () => {
    setConfirmBulkDelete('rejected');
  };

  const handleDeleteAllCompleted = async () => {
    setConfirmBulkDelete('completed');
  };

  const executeBulkDelete = async () => {
    if (confirmBulkDelete === 'rejected') {
      setIsDeletingAll(true);
      await deleteAllRejectedRequests();
      setRequests(prev => prev.filter(r => r.status !== "rejected"));
      setIsDeletingAll(false);
    } else if (confirmBulkDelete === 'completed') {
      setIsDeletingAllCompleted(true);
      await deleteAllCompletedRequests();
      setRequests(prev => prev.filter(r => r.status !== "completed"));
      setIsDeletingAllCompleted(false);
    }
    setConfirmBulkDelete(null);
  };

  const counts = {
    new: requests.filter(r => r.status === "new").length,
    reviewing: requests.filter(r => r.status === "reviewing").length,
    accepted: requests.filter(r => r.status === "accepted").length,
    in_progress: requests.filter(r => r.status === "in_progress").length,
    completed: requests.filter(r => r.status === "completed").length,
    rejected: requests.filter(r => r.status === "rejected").length,
    all: requests.length,
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Filters */}
      <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {[
          { id: "all", label: "All", count: counts.all },
          { id: "new", label: "New", count: counts.new },
          { id: "reviewing", label: "Reviewing", count: counts.reviewing },
          { id: "accepted", label: "Accepted", count: counts.accepted },
          { id: "in_progress", label: "In Progress", count: counts.in_progress },
          { id: "completed", label: "Completed", count: counts.completed },
          { id: "rejected", label: "Rejected", count: counts.rejected },
        ].map(filter => (
          <button
            key={filter.id}
            style={{ animationDelay: `${["all","new","reviewing","accepted","in_progress","completed","rejected"].indexOf(filter.id) * 40}ms` }}
            onClick={() => setFilterStatus(filter.id)}
            className={`press pop whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold border flex items-center gap-2 ${
              filterStatus === filter.id 
                ? "bg-[var(--hi)] text-[var(--ink)] border-[var(--hi)] shadow-md" 
                : "bg-white text-[var(--mute)] border-gray-200 hover:border-[var(--hi)] hover:bg-[var(--hi-soft)] hover:text-[var(--ink)] shadow-sm"
            }`}
          >
            {filter.label} 
            <span className={`min-w-[22px] text-center px-1.5 py-1 rounded-md text-xs font-bold leading-none tabular-nums ${
              filterStatus === filter.id ? "bg-white text-[var(--ink)]" : "bg-gray-100 text-gray-600"
            }`}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <input 
          type="text" 
          placeholder="Search by ref code, name, phone, email, college..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md px-4 py-2.5 border-2 border-[var(--ink)] rounded-lg text-sm outline-none focus:ring-4 focus:ring-[var(--hi-soft)] transition-all bg-white"
          />
        
        {filterStatus === "rejected" && counts.rejected > 0 && (
          <button
            onClick={handleDeleteAllRejected}
            disabled={isDeletingAll}
            className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50 shrink-0"
          >
            {isDeletingAll ? "Deleting..." : "Delete All Rejected"}
          </button>
        )}

        {filterStatus === "completed" && counts.completed > 0 && (
          <button
            onClick={handleDeleteAllCompleted}
            disabled={isDeletingAllCompleted}
            className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded transition-colors disabled:opacity-50 shrink-0"
          >
            {isDeletingAllCompleted ? "Deleting..." : "Delete All Completed"}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="pop p-8 text-center text-[var(--mute)] text-sm bg-white border rounded-xl" style={{ borderColor: "var(--rule)" }}>
            No requests found.
          </div>
        ) : (
          filtered.map((req, i) => {
            const urgency = getUrgency(req.deadline);
            const daysLeft = formatDaysLeft(req.deadline);
            let urgencyColor = "var(--ink)";
            if (urgency === "overdue" || urgency === "critical") urgencyColor = "var(--flag)";
            if (urgency === "comfortable") urgencyColor = "var(--mute)";
            let badgeStyle: React.CSSProperties = { 
              borderColor: "var(--rule)", 
              color: "var(--ink)", 
              background: "var(--paper)" 
            };
            if (req.status === "accepted") { badgeStyle.color = "white"; badgeStyle.borderColor = "var(--go)"; badgeStyle.background = "var(--go)"; }
            else if (req.status === "rejected") { badgeStyle.color = "white"; badgeStyle.borderColor = "var(--flag)"; badgeStyle.background = "var(--flag)"; }
            else if (req.status === "reviewing") { badgeStyle.color = "white"; badgeStyle.borderColor = "#3B82F6"; badgeStyle.background = "#3B82F6"; } // Blue
            else if (req.status === "in_progress") { badgeStyle.color = "white"; badgeStyle.borderColor = "#EAB308"; badgeStyle.background = "#EAB308"; } // Yellow

            let titleStyle: React.CSSProperties = { color: "var(--ink)", textDecoration: "none" };
            if (req.status === "completed") {
              titleStyle.color = "var(--mute)";
              titleStyle.textDecoration = "line-through";
            }

            return (
              <div key={req.id} className="pop bg-white border rounded-xl p-3 sm:p-4 flex flex-row gap-3 sm:gap-4 hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--hi)] transition-all" style={{ borderColor: "var(--rule)", animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                
                <button 
                  onClick={() => handleToggleStar(req.id, req.starred)}
                  className="press text-xl leading-none focus:outline-none hidden sm:block mt-1"
                  style={{ color: req.starred ? "#EAB308" : "var(--rule)" }}
                >
                  {req.starred ? "★" : "☆"}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-xs font-semibold text-[var(--mute)] flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="sm:hidden" onClick={() => handleToggleStar(req.id, req.starred)} style={{ color: req.starred ? "#EAB308" : "var(--rule)" }}>{req.starred ? "★" : "☆"}</span>
                      <span>{req.studentName} · {req.college}</span>
                      <span className="sm:hidden font-mono font-bold text-[var(--ink)] bg-[var(--hi)] px-2 py-0.5 rounded-md">{req.refCode}</span>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/x9/${req.id}`} 
                    className={`block ${req.status === "rejected" ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
                      <span className="font-bold text-base" style={titleStyle}>{req.title}</span>
                      <span className="text-xs border px-2 py-0.5 rounded-md" style={{ borderColor: "var(--rule)", color: "var(--mute)" }}>
                        {CATEGORY_LABELS[req.category] || req.category}
                      </span>
                      <span className="text-xs border px-2 py-0.5 rounded-md" style={badgeStyle}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm font-semibold tabular-nums">
                      <span style={{ color: urgencyColor }}>
                        {new Date(req.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {daysLeft}
                      </span>
                      <span className="text-[var(--mute)]">
                        {BUDGET_LABELS[req.budgetBand] || req.budgetBand}
                      </span>
                    </div>
                  </Link>
                </div>

                <div className="flex flex-col items-end justify-center sm:justify-start shrink-0 gap-2 sm:mt-1">
                  <div className="hidden sm:block font-mono text-xs font-bold text-[var(--ink)] bg-[var(--hi)] px-2 py-0.5 rounded-md">{req.refCode}</div>
                  {req.status === "rejected" && req.rejectedAt && (() => {
                    const rejectedDate = new Date(req.rejectedAt);
                    const deleteDate = new Date(rejectedDate);
                    deleteDate.setMinutes(deleteDate.getMinutes() + autoDeleteTimer);
                    const msLeft = deleteDate.getTime() - Date.now();
                    
                    if (msLeft <= 0) {
                      return (
                        <div className="text-xs text-red-500 flex items-center gap-1 text-right font-bold">
                          🕐 <span>Deleting on next refresh...</span>
                        </div>
                      );
                    }
                    
                    const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
                    if (hoursLeft > 24) {
                      const daysLeft = Math.ceil(hoursLeft / 24);
                      return (
                        <div className="text-xs text-[var(--mute)] flex items-center gap-1 text-right">
                          🕐 <span>Auto-delete in {daysLeft}d</span>
                        </div>
                      );
                    }
                    
                    const minutesLeft = Math.ceil(msLeft / (1000 * 60));
                    return (
                      <div className="text-xs text-[var(--mute)] flex items-center gap-1 text-right">
                        🕐 <span>Auto-delete in {minutesLeft}m</span>
                      </div>
                    );
                  })()}
                  <button
                    onClick={(e) => handleDeleteClick(req.id, e)}
                    aria-label="Delete request" title="Delete"
                    className="press grid place-items-center w-9 h-9 text-red-800 sm:text-red-500 hover:text-red-700 bg-red-100 sm:bg-red-50 hover:bg-red-200 sm:hover:bg-red-100 rounded-lg"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 max-w-sm w-full rounded-xl shadow-xl pop">
            <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Delete Request?</h3>
            <p className="text-sm text-[var(--mute)] mb-6">
              Are you sure you want to delete this request? This action cannot be undone and will delete any attached files.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm font-semibold border rounded hover:bg-gray-50 transition-colors"
                style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 max-w-sm w-full rounded-xl shadow-xl pop">
            <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Delete All {confirmBulkDelete === 'rejected' ? 'Rejected' : 'Completed'}?</h3>
            <p className="text-sm text-[var(--mute)] mb-6">
              Are you sure you want to permanently delete <strong>ALL</strong> {confirmBulkDelete} projects? This action cannot be undone and will permanently delete all of their attached files.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmBulkDelete(null)}
                disabled={isDeletingAll || isDeletingAllCompleted}
                className="px-4 py-2 text-sm font-semibold border rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
              >
                Cancel
              </button>
              <button 
                onClick={executeBulkDelete}
                disabled={isDeletingAll || isDeletingAllCompleted}
                className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {(isDeletingAll || isDeletingAllCompleted) ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
