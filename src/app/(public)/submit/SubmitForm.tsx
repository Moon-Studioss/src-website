"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitProjectRequest, discardUpload } from "@/app/actions";
import { useUploadThing } from "@/components/ui/uploadthing";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import { DeadlineSlider } from "./DeadlineSlider";
import { Loader2, Calendar as CalendarIcon, AppWindow, Smartphone, BrainCircuit, Cpu, Monitor, Compass } from "lucide-react";

const CATEGORIES = [
  { id: "web", label: "Website / Web App", icon: <AppWindow size={28} strokeWidth={1.5} /> },
  { id: "app", label: "Mobile App", icon: <Smartphone size={28} strokeWidth={1.5} /> },
  { id: "ml", label: "ML / AI", icon: <BrainCircuit size={28} strokeWidth={1.5} /> },
  { id: "iot", label: "IoT / Hardware", icon: <Cpu size={28} strokeWidth={1.5} /> },
  { id: "software", label: "Desktop Software", icon: <Monitor size={28} strokeWidth={1.5} /> },
  { id: "unsure", label: "Not Sure Yet", icon: <Compass size={28} strokeWidth={1.5} /> },
];

const BUDGET_BANDS = [
  { id: "under-1500", label: "Under ₹1,500" },
  { id: "1500-3000", label: "₹1,500 – ₹3,000" },
  { id: "3000-6000", label: "₹3,000 – ₹6,000" },
  { id: "6000-10000", label: "₹6,000 – ₹10,000" },
  { id: "10000-plus", label: "₹10,000+" },
  { id: "not-sure", label: "Not sure yet" },
];

const DELIVERABLES = [
  { id: "prototype", label: "Working prototype" },
  { id: "complete", label: "Complete project" },
  { id: "modify", label: "Fix / modify an existing project" },
  { id: "demo", label: "Only a demo for review/viva" },
  { id: "unsure", label: "Not sure" },
];

export function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [starting, setStarting] = useState(false); // covers the gap between picking a file and the first progress event
  const { startUpload, isUploading: uploading } = useUploadThing("projectFiles", {
    onUploadProgress: setUploadPct,
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        updateForm("files", [{ key: res[0].key, url: res[0].url, name: res[0].name, size: res[0].size }]);
        setFileError(null);
      }
    },
    onUploadError: (error: Error) => setFileError(`Upload failed: ${error.message}`),
  });
  const isUploading = uploading || starting;
  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again after an error
    if (!file) return;
    if (file.size > 1024 * 1024) { setFileError("That file is over 1MB. Please pick a smaller one."); return; }
    setFileError(null);
    setUploadPct(0);
    setStarting(true);
    startUpload([file]).finally(() => setStarting(false));
  };

  // Form State
  const [formData, setFormData] = useState({
    category: "",
    title: "",
    description: "",
    deliverable: "",
    techNotes: "",
    deadline: "",
    budgetBand: "",
    files: [] as any[],
    studentName: "",
    college: "",
    phone: "",
    whatsapp: "",
    email: "",
    extraNotes: "",
    branchAnswers: {} as Record<string, string>,
  });

  const [usePhoneForWhatsApp, setUsePhoneForWhatsApp] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize state on mount (prioritize URL params over localStorage)
  useEffect(() => {
    let initialData = {
      category: "",
      title: "",
      description: "",
      deliverable: "",
      techNotes: "",
      deadline: "",
      budgetBand: "",
      files: [] as any[],
      studentName: "",
      college: "",
      phone: "",
      whatsapp: "",
      email: "",
      extraNotes: "",
      branchAnswers: {} as Record<string, string>,
    };

    // 1. Load from localStorage if present
    const saved = localStorage.getItem("src_form_draft");
    if (saved) {
      try {
        initialData = { ...initialData, ...JSON.parse(saved) };
      } catch (e) {}
    }

    // 2. Override with URL params if present
    const queryCategory = searchParams?.get("category");
    const queryTitle = searchParams?.get("title");
    
    let nextStep = 1;
    
    if (queryCategory) {
      initialData.category = queryCategory;
      if (queryTitle) initialData.title = queryTitle;
      nextStep = 2;
    } else if (initialData.category) {
      nextStep = 2;
    }

    setFormData(initialData);
    setStep(nextStep);
  }, [searchParams]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("src_form_draft", JSON.stringify(formData));
  }, [formData]);

  const updateForm = (key: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateBranch = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      branchAnswers: { ...prev.branchAnswers, [key]: value }
    }));
  };

  const handleCategorySelect = (id: string) => {
    updateForm("category", id);
    setStep(2);
  };

  const validateStep2 = () => formData.title && formData.description && formData.deliverable;
  const validateStep3 = () => formData.deadline && formData.budgetBand;
  const validateStep4 = () => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const isValidPhone = /^\d{10}$/.test(formData.phone);
    const isValidWhatsApp = usePhoneForWhatsApp || /^\d{10}$/.test(formData.whatsapp);
    return formData.studentName && formData.college && isValidPhone && isValidWhatsApp && isValidEmail;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    const result = await submitProjectRequest({
      ...formData,
      whatsapp: usePhoneForWhatsApp ? formData.phone : formData.whatsapp,
    });
    if (result.success) {
      localStorage.removeItem("src_form_draft");
      router.push(`/submitted?code=${result.refCode}`);
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  // Completeness Meter Logic
  const wordCount = formData.description.trim().split(/\s+/).filter(w => w.length > 0).length;
  const hasFile = formData.files.length > 0;
  const hasBranchAnswers = Object.keys(formData.branchAnswers).length > 0;
  
  let completenessMessage = "Add a few more lines so we can understand your idea";
  let completenessColor = "var(--flag)";
  if (wordCount >= 80 && hasFile && (hasBranchAnswers || formData.category === 'unsure')) {
    completenessMessage = "Very clear — we probably won't need to call you";
    completenessColor = "var(--go)";
  } else if (wordCount >= 30 || hasFile) {
    completenessMessage = "Good — this explains the basic idea";
    completenessColor = "var(--ink)";
  }

  // If category is cleared or empty, force back to step 1
  const effectiveStep = formData.category ? step : 1;

  return (
    <div className="w-full relative overflow-x-clip pb-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: s <= effectiveStep ? "var(--hi)" : "var(--rule)" }}
          />
        ))}
      </div>

      <div className="flex justify-between text-sm font-semibold mb-8 text-[var(--mute)]">
        <span>Step {effectiveStep} of 4</span>
        <span className="font-normal">About 3 minutes</span>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* STEP 1: Category */}
      {effectiveStep === 1 && (
        <div className="animate-in slide-in-from-right-4 fade-in duration-200">
          <h2 className="font-display text-3xl font-extrabold mb-6 text-[var(--ink)]"><span className="hl">What kind of project is this?</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="press flex items-center gap-4 p-5 md:p-6 text-left rounded-2xl border hover:border-[var(--ink)] hover:bg-[var(--hi-soft)] transition-colors duration-150 bg-white"
                style={{ borderColor: formData.category === cat.id ? "var(--ink)" : "var(--rule)", background: formData.category === cat.id ? "var(--hi-soft)" : undefined }}
              >
                <div className="grid place-items-center w-12 h-12 shrink-0 rounded-full bg-[var(--hi)] text-[var(--ink)]">{cat.icon}</div>
                <div className="font-semibold text-[var(--ink)]">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Project Details */}
      {effectiveStep === 2 && (
        <div className="animate-in slide-in-from-right-4 fade-in duration-200 space-y-8">
          <h2 className="font-display text-3xl font-extrabold text-[var(--ink)]"><span className="hl">About the Project</span></h2>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--ink)]">Project Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateForm("title", e.target.value.toUpperCase())}
              placeholder="e.g. Smart Attendance System"
              className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
              style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--ink)]">Describe your project *</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateForm("description", e.target.value)}
              placeholder="e.g. A face recognition system for our college lab that automatically marks attendance when a student enters the room. The system should store records and let the HOD download reports."
              rows={5}
              className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
              style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
            />
            <div className="flex justify-between items-center text-xs mt-1">
              <span style={{ color: completenessColor }}>{completenessMessage}</span>
              <span className="text-[var(--mute)]">{wordCount} words</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--ink)]">What do you need from us? *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DELIVERABLES.map((del) => (
                <button
                  key={del.id}
                  onClick={() => updateForm("deliverable", del.id)}
                  className="press p-3 rounded-xl text-left border text-sm transition-colors"
                  style={{
                    borderColor: formData.deliverable === del.id ? "var(--ink)" : "var(--rule)",
                    background: formData.deliverable === del.id ? "var(--hi)" : "var(--paper)",
                    color: "var(--ink)",
                  }}
                >
                  {del.label}
                </button>
              ))}
            </div>
          </div>

          {/* Branch Questions */}
          {formData.category === "web" && (
            <div className="space-y-6 pt-4 border-t border-[var(--rule)]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">Do you have a reference website or design?</label>
                <div className="flex gap-3">
                  {["Yes", "No", "I'll share one"].map((opt) => (
                    <button key={opt} onClick={() => updateBranch("hasDesign", opt)} className={`press px-4 py-2 rounded-full border text-sm ${formData.branchAnswers["hasDesign"] === opt ? 'border-[var(--ink)] bg-[var(--hi)] text-[var(--ink)] font-semibold' : 'border-[var(--rule)] bg-white text-[var(--ink)]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">Does it need a login system or admin panel?</label>
                <div className="flex gap-3">
                  {["Yes", "No", "Not sure"].map((opt) => (
                    <button key={opt} onClick={() => updateBranch("needsLogin", opt)} className={`press px-4 py-2 rounded-full border text-sm ${formData.branchAnswers["needsLogin"] === opt ? 'border-[var(--ink)] bg-[var(--hi)] text-[var(--ink)] font-semibold' : 'border-[var(--rule)] bg-white text-[var(--ink)]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formData.category === "app" && (
            <div className="space-y-6 pt-4 border-t border-[var(--rule)]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">Which platform?</label>
                <div className="flex gap-3">
                  {["Android", "iOS", "Both"].map((opt) => (
                    <button key={opt} onClick={() => updateBranch("platform", opt)} className={`press px-4 py-2 rounded-full border text-sm ${formData.branchAnswers["platform"] === opt ? 'border-[var(--ink)] bg-[var(--hi)] text-[var(--ink)] font-semibold' : 'border-[var(--rule)] bg-white text-[var(--ink)]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">Does it need a backend or database?</label>
                <div className="flex gap-3">
                  {["Yes", "No", "Not sure"].map((opt) => (
                    <button key={opt} onClick={() => updateBranch("needsBackend", opt)} className={`press px-4 py-2 rounded-full border text-sm ${formData.branchAnswers["needsBackend"] === opt ? 'border-[var(--ink)] bg-[var(--hi)] text-[var(--ink)] font-semibold' : 'border-[var(--rule)] bg-white text-[var(--ink)]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formData.category === "ml" && (
            <div className="space-y-6 pt-4 border-t border-[var(--rule)]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">Do you already have a dataset?</label>
                <div className="flex gap-3">
                  {["Yes", "No", "Partially"].map((opt) => (
                    <button key={opt} onClick={() => updateBranch("hasDataset", opt)} className={`press px-4 py-2 rounded-full border text-sm ${formData.branchAnswers["hasDataset"] === opt ? 'border-[var(--ink)] bg-[var(--hi)] text-[var(--ink)] font-semibold' : 'border-[var(--rule)] bg-white text-[var(--ink)]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">Does it need a UI?</label>
                <div className="flex flex-wrap gap-3">
                  {["Needs a UI", "Notebook/demo is fine", "Not sure"].map((opt) => (
                    <button key={opt} onClick={() => updateBranch("needsUi", opt)} className={`press px-4 py-2 rounded-full border text-sm ${formData.branchAnswers["needsUi"] === opt ? 'border-[var(--ink)] bg-[var(--hi)] text-[var(--ink)] font-semibold' : 'border-[var(--rule)] bg-white text-[var(--ink)]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formData.category === "iot" && (
            <div className="space-y-6 pt-4 border-t border-[var(--rule)]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">Who arranges the components — you or us?</label>
                <div className="flex flex-wrap gap-3">
                  {["I will arrange", "You arrange (add to cost)", "Not sure"].map((opt) => (
                    <button key={opt} onClick={() => updateBranch("hardwareSource", opt)} className={`press px-4 py-2 rounded-full border text-sm ${formData.branchAnswers["hardwareSource"] === opt ? 'border-[var(--ink)] bg-[var(--hi)] text-[var(--ink)] font-semibold' : 'border-[var(--rule)] bg-white text-[var(--ink)]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">Which hardware do you already have? (optional)</label>
                <input
                  type="text"
                  value={formData.branchAnswers["existingHardware"] || ""}
                  onChange={(e) => updateBranch("existingHardware", e.target.value)}
                  placeholder="e.g. Arduino Uno, DHT11 sensor"
                  className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
                  style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
                />
              </div>
            </div>
          )}

          {formData.category === "software" && (
            <div className="space-y-6 pt-4 border-t border-[var(--rule)]">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">What platform must it run on?</label>
                <div className="flex flex-wrap gap-3">
                  {["Windows", "Mac", "Linux", "Any"].map((opt) => (
                    <button key={opt} onClick={() => updateBranch("platform", opt)} className={`press px-4 py-2 rounded-full border text-sm ${formData.branchAnswers["platform"] === opt ? 'border-[var(--ink)] bg-[var(--hi)] text-[var(--ink)] font-semibold' : 'border-[var(--rule)] bg-white text-[var(--ink)]'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 z-20 -mx-6 px-6 py-3 bg-white/95 border-t border-[var(--rule)] flex justify-between gap-3 md:static md:mx-0 md:px-0 md:pt-6 md:border-0 md:bg-transparent" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            <button onClick={() => setStep(1)} className="press h-12 px-6 rounded-full border border-[var(--rule)] bg-white hover:bg-gray-50 text-[var(--ink)] font-semibold transition-colors">
              Back
            </button>
            <button 
              onClick={() => setStep(3)} 
              disabled={!validateStep2()}
              className="press h-12 px-7 rounded-full bg-[var(--hi)] text-[var(--ink)] font-bold disabled:opacity-40 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Timeline, Budget, Files */}
      {effectiveStep === 3 && (
        <div className="animate-in slide-in-from-right-4 fade-in duration-200 space-y-8">
          <h2 className="font-display text-3xl font-extrabold text-[var(--ink)]"><span className="hl">Logistics</span></h2>
          
          <div className="space-y-2 relative" ref={datePickerRef}>
            <p className="text-sm font-semibold text-[var(--ink)]">How many days until your deadline? *</p>
            <DeadlineSlider deadline={formData.deadline} onChange={(iso) => updateForm("deadline", iso)} />
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)] underline underline-offset-4"
            >
              <CalendarIcon className="w-4 h-4" />
              {formData.deadline ? `Exact date: ${format(new Date(formData.deadline), "PPP")}` : "Pick an exact date instead"}
            </button>
            
            {showDatePicker && (
              <div className="absolute z-30 top-full mt-2 left-0 bg-white border rounded-2xl p-3 shadow-lg" style={{ borderColor: "var(--rule)" }}>
                <DayPicker 
                  mode="single"
                  selected={formData.deadline ? new Date(formData.deadline) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      updateForm("deadline", format(date, "yyyy-MM-dd"));
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  style={{ 
                    "--rdp-accent-color": "var(--ink)", 
                    "--rdp-background-color": "var(--ink)",
                    "--rdp-accent-background-color": "var(--ink)"
                  } as React.CSSProperties}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--ink)]">Budget range *</label>
            <select
              value={formData.budgetBand}
              onChange={(e) => updateForm("budgetBand", e.target.value)}
              className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all appearance-none"
              style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
            >
              <option value="" disabled>Select a range</option>
              {BUDGET_BANDS.map(band => (
                <option key={band.id} value={band.id}>{band.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--ink)]">Attach file (optional)</label>
            <p className="text-sm text-[var(--mute)] mb-2">Most colleges give a project synopsis or problem statement — attach it here if you have one. <strong>1 file only, under 1MB</strong> (PDF/DOC/PNG/JPG).</p>
            
            {formData.files.length === 0 && (
              <label
                className={`flex flex-col items-center gap-3 p-6 border border-dashed rounded-xl transition-colors ${isUploading ? "bg-[var(--hi-soft)] cursor-wait" : "bg-white hover:bg-[var(--hi-soft)] cursor-pointer"}`}
                style={{ borderColor: isUploading ? "var(--hi)" : "var(--rule)" }}
              >
                <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={pickFile} disabled={isUploading} />
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin text-[var(--ink)]" size={28} />
                    <p className="text-sm font-semibold text-[var(--ink)]">Uploading… {uploadPct}%</p>
                    <div className="w-full max-w-xs h-1.5 rounded-full bg-white overflow-hidden">
                      <div className="h-full bg-[var(--hi)] transition-[width] duration-200" style={{ width: `${uploadPct}%` }} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[var(--ink)]">📎 Click anywhere here to select your file</p>
                    <p className="text-xs text-[var(--mute)]">1 file · Max 1MB · PDF, DOC, PNG, JPG</p>
                  </>
                )}
                {fileError && <p className="text-red-600 text-sm">{fileError}</p>}
              </label>
            )}

            {formData.files.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.files.map((f, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border bg-white text-sm" style={{ borderColor: "var(--rule)" }}>
                    <span className="truncate max-w-[80%] font-mono">{f.name}</span>
                    <button 
                      onClick={() => { discardUpload(f.key); updateForm("files", formData.files.filter((_, idx) => idx !== i)); }}
                      className="text-red-500 font-bold px-2 hover:bg-red-50 rounded"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 z-20 -mx-6 px-6 py-3 bg-white/95 border-t border-[var(--rule)] flex justify-between gap-3 md:static md:mx-0 md:px-0 md:pt-6 md:border-0 md:bg-transparent" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            <button onClick={() => setStep(2)} className="press h-12 px-6 rounded-full border border-[var(--rule)] bg-white hover:bg-gray-50 text-[var(--ink)] font-semibold transition-colors">
              Back
            </button>
            <button 
              onClick={() => setStep(4)} 
              disabled={!validateStep3() || isUploading}
              className="press h-12 px-7 rounded-full bg-[var(--hi)] text-[var(--ink)] font-bold disabled:opacity-40 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Contact */}
      {effectiveStep === 4 && (
        <div className="animate-in slide-in-from-right-4 fade-in duration-200 space-y-8">
          <h2 className="font-display text-3xl font-extrabold text-[var(--ink)]"><span className="hl">How to reach you</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--ink)]">Your name *</label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => updateForm("studentName", e.target.value.toUpperCase())}
                className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
                style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--ink)]">College / University *</label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => updateForm("college", e.target.value.toUpperCase())}
                className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
                style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--ink)]">Phone number (10 digits) *</label>
              <input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => updateForm("phone", e.target.value.replace(/\D/g, ""))}
                className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
                style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
              />
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="wa-check"
                  checked={usePhoneForWhatsApp}
                  onChange={(e) => setUsePhoneForWhatsApp(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="wa-check" className="text-sm text-[var(--ink)] cursor-pointer">Same as phone number for WhatsApp</label>
              </div>
            </div>

            {!usePhoneForWhatsApp && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--ink)]">WhatsApp number (10 digits) *</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={formData.whatsapp}
                  onChange={(e) => updateForm("whatsapp", e.target.value.replace(/\D/g, ""))}
                  className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
                  style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--ink)]">Email address *</label>
            <input
              type="email"
              placeholder="you@domain.com"
              value={formData.email}
              onChange={(e) => updateForm("email", e.target.value)}
              className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
              style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
            />
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-sm font-semibold text-[var(--ink)]">Anything else you want to add (optional)</label>
            <textarea
              value={formData.extraNotes}
              onChange={(e) => updateForm("extraNotes", e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
              style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
            />
          </div>

          <div className="sticky bottom-0 z-20 -mx-6 px-6 py-3 bg-white/95 border-t border-[var(--rule)] flex justify-between gap-3 md:static md:mx-0 md:px-0 md:pt-6 md:bg-transparent" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
            <button onClick={() => setStep(3)} className="press h-12 px-6 rounded-full border border-[var(--rule)] bg-white hover:bg-gray-50 text-[var(--ink)] font-semibold transition-colors">
              Back
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={!validateStep4() || isSubmitting}
              className="press h-12 px-7 rounded-full bg-[var(--hi)] text-[var(--ink)] font-bold disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Sending..." : "Send project request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
