"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { updateStatus, updateAdminNotes } from "../actions";
import { formatDaysLeft, CATEGORY_LABELS, BUDGET_LABELS } from "@/lib/utils/helpers";

export function RequestDetailClient({ request, attachments, whatsappTemplate = "Hi {name}, this is regarding your project request {ref} ({title}). I can take this up. Let's discuss the details." }: { request: any, attachments: any[], whatsappTemplate?: string }) {
  const [status, setStatus] = useState(request.status);
  const [notes, setNotes] = useState(request.adminNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus); // Optimistic UI
    await updateStatus(request.id, newStatus);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await updateAdminNotes(request.id, notes);
    setSavingNotes(false);
  };

  const handleCopyDetails = () => {
    const text = `Request: ${request.refCode}\nTitle: ${request.title}\nStudent: ${request.studentName} (${request.college})\nPhone: ${request.phone}\nDeadline: ${new Date(request.deadline).toLocaleDateString()}\nBudget: ${BUDGET_LABELS[request.budgetBand]}\n\nDescription:\n${request.description}`;
    navigator.clipboard.writeText(text);
    alert("Details copied to clipboard!");
  };

  const firstName = request.studentName.split(" ")[0];
  const whatsappMessage = whatsappTemplate
    .replace(/{name}/g, firstName)
    .replace(/{ref}/g, request.refCode)
    .replace(/{title}/g, request.title);
    
  const whatsappUrl = `https://wa.me/${request.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <div className="font-mono font-bold text-lg text-[var(--ink)] tracking-wider mb-1">{request.refCode}</div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink)]">{request.title}</h1>
          <div className="text-sm text-[var(--mute)] mt-1">
            {CATEGORY_LABELS[request.category]} · Submitted {new Date(request.createdAt).toLocaleDateString("en-GB")}
          </div>
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 w-full sm:w-auto">
          {(() => {
            let badgeStyle: React.CSSProperties = { 
              borderColor: "var(--rule)", 
              color: "white", 
              background: "var(--paper)",
              textDecoration: "none"
            };
            if (status === "accepted") { badgeStyle.background = "var(--go)"; badgeStyle.borderColor = "var(--go)"; }
            else if (status === "rejected") { badgeStyle.background = "var(--flag)"; badgeStyle.borderColor = "var(--flag)"; }
            else if (status === "reviewing") { badgeStyle.background = "#3b82f6"; badgeStyle.borderColor = "#3b82f6"; }
            else if (status === "in_progress") { badgeStyle.background = "#eab308"; badgeStyle.borderColor = "#eab308"; }
            else if (status === "completed") { badgeStyle.background = "var(--mute)"; badgeStyle.borderColor = "var(--mute)"; badgeStyle.textDecoration = "line-through"; }
            else { badgeStyle.color = "var(--ink)"; }

            return (
              <div 
                className="py-1 px-4 text-xs font-bold border rounded-lg shadow-sm"
                style={badgeStyle}
              >
                {status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            );
          })()}

          {(status === "new" || status === "reviewing") && (
            <div className="flex gap-2">
              <button 
                onClick={() => handleStatusChange("rejected")}
                aria-label="Reject" title="Reject"
                className="press flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-2 text-sm font-bold text-[var(--flag)] border border-[var(--flag)] hover:bg-red-50 rounded-full sm:rounded-lg"
              >
                <X size={20} strokeWidth={2.5} className="sm:hidden" /><span className="hidden sm:inline">Reject</span>
              </button>
              <button 
                onClick={() => handleStatusChange("in_progress")}
                aria-label="Accept" title="Accept"
                className="press flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-2 text-sm font-bold text-white bg-[var(--go)] hover:opacity-90 rounded-full sm:rounded-lg"
              >
                <Check size={20} strokeWidth={2.5} className="sm:hidden" /><span className="hidden sm:inline">Accept</span>
              </button>
            </div>
          )}

          {status === "in_progress" && (
            <button 
              onClick={() => handleStatusChange("completed")}
              className="press px-5 py-2 text-sm font-bold text-[var(--ink)] bg-[var(--hi)] hover:opacity-90 rounded-lg"
            >
              Mark Completed
            </button>
          )}
        </div>
      </div>

      <hr className="my-8 border-[var(--rule)]" />

      {/* STUDENT SECTION */}
      <section className="pop">
        <h2 className="inline-block bg-[var(--ink)] text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded-md border-l-4 border-[var(--hi)] mb-4">STUDENT</h2>
        <div className="text-sm text-[var(--ink)] space-y-1">
          <div className="font-bold">{request.studentName}</div>
          <div>{request.college}</div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 sm:gap-6">
            <a href={`tel:${request.phone}`} className="press rounded-lg bg-[var(--paper-2)] hover:bg-[var(--hi-soft)] px-4 py-1.5 w-fit">📞 {request.phone}</a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="press rounded-lg bg-[var(--paper-2)] hover:bg-[var(--hi-soft)] px-4 py-1.5 w-fit text-[var(--go)]">💬 {request.whatsapp}</a>
            <a href={`mailto:${request.email}`} className="break-all press rounded-lg bg-[var(--paper-2)] hover:bg-[var(--hi-soft)] px-4 py-1.5 w-fit">✉ {request.email}</a>
          </div>
        </div>
      </section>

      <hr className="my-8 border-[var(--rule)]" />

      {/* PROJECT SUMMARY */}
      <section className="pop">
        <h2 className="inline-block bg-[var(--ink)] text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded-md border-l-4 border-[var(--hi)] mb-4">PROJECT SUMMARY</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 text-sm">
          <div className="text-[var(--mute)]">Category</div>
          <div className="text-[var(--ink)] font-semibold">{CATEGORY_LABELS[request.category]}</div>
          
          <div className="text-[var(--mute)] mt-2 sm:mt-0">Needs</div>
          <div className="text-[var(--ink)] font-semibold">{request.deliverable}</div>
          
          <div className="text-[var(--mute)] mt-2 sm:mt-0">Deadline</div>
          <div className="text-[var(--ink)] font-semibold tabular-nums">{new Date(request.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {formatDaysLeft(request.deadline)}</div>
          
          <div className="text-[var(--mute)] mt-2 sm:mt-0">Budget</div>
          <div className="text-[var(--ink)] font-semibold">{BUDGET_LABELS[request.budgetBand]}</div>
          
          {request.techNotes && (
            <>
              <div className="text-[var(--mute)] mt-2 sm:mt-0">Technologies</div>
              <div className="text-[var(--ink)] font-semibold">{request.techNotes}</div>
            </>
          )}
        </div>
      </section>

      {Object.keys(request.branchAnswers || {}).length > 0 && (
        <>
          <h2 className="inline-block bg-[var(--ink)] text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded-md border-l-4 border-[var(--hi)] mt-8 mb-4">BRANCH ANSWERS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 text-sm">
            {Object.entries(request.branchAnswers).map(([k, v]) => (
              <React.Fragment key={k}>
                <div className="text-[var(--mute)] break-words">{k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                <div className="text-[var(--ink)] font-semibold">{v as string}</div>
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      <hr className="my-8 border-[var(--rule)]" />

      {/* DESCRIPTION */}
      <section className="pop">
        <h2 className="inline-block bg-[var(--ink)] text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded-md border-l-4 border-[var(--hi)] mb-4">DESCRIPTION</h2>
        <p className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap max-w-3xl">
          {request.description}
        </p>
      </section>

      {request.extraNotes && (
        <>
          <hr className="my-8 border-[var(--rule)]" />
          <section className="pop">
            <h2 className="inline-block bg-[var(--ink)] text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded-md border-l-4 border-[var(--hi)] mb-4">ADDITIONAL NOTES</h2>
            <p className="text-sm text-[var(--ink)] leading-relaxed whitespace-pre-wrap max-w-3xl">
              {request.extraNotes}
            </p>
          </section>
        </>
      )}

      {attachments.length > 0 && (
        <>
          <hr className="my-8 border-[var(--rule)]" />
          <section className="pop">
            <h2 className="inline-block bg-[var(--ink)] text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded-md border-l-4 border-[var(--hi)] mb-4">ATTACHMENTS</h2>
            <div className="space-y-2">
              {attachments.map(att => (
                <div key={att.id} className="flex justify-between items-center p-3 border rounded-xl bg-[var(--paper-2)] text-sm max-w-2xl" style={{ borderColor: "var(--rule)" }}>
                  <span className="truncate max-w-[70%] font-mono text-[var(--ink)]">{att.fileName}</span>
                  <div className="flex gap-4">
                    <span className="text-[var(--mute)] tabular-nums font-mono">{Math.round(att.sizeBytes / 1024)} KB</span>
                    <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="press font-semibold text-[var(--ink)] bg-[var(--hi)] rounded-lg px-3 py-0.5">Download</a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <hr className="my-8 border-[var(--rule)]" />

      {/* PRIVATE NOTES */}
      <section className="pop">
        <div className="flex justify-between items-center mb-4">
          <h2 className="inline-block bg-[var(--ink)] text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded-md border-l-4 border-[var(--hi)]">YOUR NOTES</h2>
          <span className="text-xs px-2.5 py-0.5 bg-[var(--hi-soft)] text-[var(--ink)] rounded-md">private</span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Quoted 5k, waiting for reply"
          rows={3}
          className="w-full max-w-2xl px-4 py-3 border rounded-lg outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all text-sm"
          style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
        />
        <div className="mt-2">
          <button 
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="press text-xs font-semibold px-5 py-2 border rounded-lg hover:bg-[var(--hi-soft)] disabled:opacity-50"
            style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
          >
            {savingNotes ? "Saving..." : "Save notes"}
          </button>
        </div>
      </section>

      {/* FIXED BOTTOM ACTIONS */}
      <div className="fixed bottom-[calc(var(--tab-h)+0.75rem)] sm:bottom-4 inset-x-0 z-10 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md sm:w-auto flex flex-row items-center gap-2 p-2 bg-white/95 backdrop-blur border rounded-xl shadow-xl" style={{ borderColor: "var(--rule)" }}>
          <button 
            onClick={handleCopyDetails}
            className="press flex-1 sm:flex-none py-2.5 px-3 sm:px-5 bg-[var(--hi)] font-bold text-sm rounded-lg hover:brightness-95 flex items-center justify-center gap-2 whitespace-nowrap"
            style={{ color: "var(--ink)" }}
          >
            <span className="text-base">📋</span> Copy details
          </button>
          
          <a 
            href={whatsappUrl}
            target="_blank" 
            rel="noopener noreferrer"
            className="press flex-1 sm:flex-none py-2.5 px-3 sm:px-5 bg-[var(--go)] text-white font-bold text-sm rounded-lg hover:brightness-110 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg leading-none">💬</span> <span><span className="hidden sm:inline">Message on </span>WhatsApp</span>
          </a>
        </div>
      </div>

    </>
  );
}
