"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { getSettings, saveAllSettings } from "../app/x9/settings-actions";
import { X, Save, ShieldAlert, CheckCircle2, Lock, Clock, Eye, EyeOff, ShoppingBag } from "lucide-react";

export function SettingsModal({ mode = 'icon', onClick }: { mode?: 'icon' | 'menu-item', onClick?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnderConstruction, setIsUnderConstruction] = useState(false);
  const [isStoreUnderConstruction, setIsStoreUnderConstruction] = useState(false);
  const [autoDeleteTimer, setAutoDeleteTimer] = useState(2880);
  const [overdueDeleteTimer, setOverdueDeleteTimer] = useState(15);
  const [whatsappTemplate, setWhatsappTemplate] = useState("Hi {name}, this is regarding your project request {ref} ({title}). I can take this up. Let's discuss the details.");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Load initial settings
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getSettings().then((s) => {
        setIsUnderConstruction(s.isUnderConstruction);
        setIsStoreUnderConstruction(s.isStoreUnderConstruction ?? false);
        setAutoDeleteTimer(s.autoDeleteTimer ?? 2880);
        setOverdueDeleteTimer(s.overdueDeleteTimer ?? 15);
        setWhatsappTemplate(s.whatsappTemplate ?? "Hi {name}, this is regarding your project request {ref} ({title}). I can take this up. Let's discuss the details.");
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleSave = async () => {
    setMessage("");
    try {
      if (newPassword && newPassword !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
      
      await saveAllSettings({
        newPassword: newPassword || undefined,
        isUnderConstruction,
        isStoreUnderConstruction,
        autoDeleteTimer,
        overdueDeleteTimer,
        whatsappTemplate
      });
      
      setMessage("Settings saved successfully.");
      setNewPassword("");
      setConfirmPassword("");
      
      // Close after 2 seconds
      setTimeout(() => setIsOpen(false), 2000);
    } catch (e: any) {
      console.error("Save settings error:", e);
      setMessage(e?.message || "Failed to save settings.");
    }
  };

  return (
    <>
      {mode === 'icon' ? (
        <button 
          onClick={() => { setIsOpen(true); onClick?.(); }}
          className="p-1.5 sm:mr-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          title="Admin Settings"
        >
          <Settings size={20} />
        </button>
      ) : (
        <button 
          onClick={() => { setIsOpen(true); onClick?.(); }}
          className="text-left font-semibold text-[var(--mute)] hover:text-[var(--ink)] transition-colors w-full"
        >
          Settings
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                <Settings size={20} className="text-[var(--mute)]" />
                Global Settings
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* LEFT COLUMN */}
                    <div className="flex-1 space-y-4 max-h-[380px] overflow-y-auto pr-2 scroll-smooth [scrollbar-width:thin] [scrollbar-color:#DDE3EC_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                      {/* Under Construction Toggle */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <h3 className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                            <ShieldAlert size={16} className="text-orange-500" />
                            Under Construction Mode
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Block all public access and show a 404 page.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isUnderConstruction}
                            onChange={(e) => setIsUnderConstruction(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      {/* Store Under Construction Toggle */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <h3 className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                            <ShoppingBag size={16} className="text-orange-500" />
                            Store Under Construction
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Hide store in navigation &amp; show under construction on /store.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isStoreUnderConstruction}
                            onChange={(e) => setIsStoreUnderConstruction(e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>

                      {/* Auto Delete Timer Dropdown */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <h3 className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                            <Clock size={16} className="text-blue-500" />
                            Auto-Delete (Rejected)
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Time before rejected projects are deleted.
                          </p>
                        </div>
                        <select
                          value={autoDeleteTimer}
                          onChange={(e) => setAutoDeleteTimer(Number(e.target.value))}
                          className="ml-4 p-2 border rounded-md outline-none focus:border-[var(--ink)] text-sm cursor-pointer bg-white"
                        >
                          <option value={2}>2 Minutes</option>
                          <option value={60}>1 Hour</option>
                          <option value={720}>12 Hours</option>
                          <option value={1440}>1 Day</option>
                          <option value={2880}>2 Days</option>
                          <option value={10080}>7 Days</option>
                        </select>
                      </div>

                      {/* Overdue Auto-Delete Dropdown */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                        <div>
                          <h3 className="font-semibold text-[var(--ink)] flex items-center gap-1.5">
                            <Clock size={16} className="text-red-500" />
                            Auto-Delete (Overdue)
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Days overdue before a project is deleted.
                          </p>
                        </div>
                        <select
                          value={overdueDeleteTimer}
                          onChange={(e) => setOverdueDeleteTimer(Number(e.target.value))}
                          className="ml-4 p-2 border rounded-md outline-none focus:border-[var(--ink)] text-sm cursor-pointer bg-white"
                        >
                          <option value={7}>7 Days</option>
                          <option value={15}>15 Days</option>
                          <option value={30}>30 Days</option>
                          <option value={60}>60 Days</option>
                        </select>
                      </div>

                      {/* WhatsApp Template */}
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[var(--ink)]">💬</span>
                          <div className="font-semibold text-sm text-[var(--ink)]">WhatsApp Message Template</div>
                        </div>
                        <div className="text-xs text-[var(--mute)] mb-3">
                          Variables you can use: <code className="bg-gray-200 px-1 py-0.5 rounded text-[var(--ink)]">{"{name}"}</code>, <code className="bg-gray-200 px-1 py-0.5 rounded text-[var(--ink)]">{"{ref}"}</code>, <code className="bg-gray-200 px-1 py-0.5 rounded text-[var(--ink)]">{"{title}"}</code>
                        </div>
                        <textarea
                          value={whatsappTemplate}
                          onChange={(e) => setWhatsappTemplate(e.target.value)}
                          className="w-full p-3 border outline-none focus:border-[var(--ink)] transition-colors text-sm rounded-md"
                          rows={4}
                          style={{ borderColor: "var(--rule)", background: "var(--paper)" }}
                        />
                      </div>
                    </div>

                    {/* VERTICAL DIVIDER */}
                    <div className="hidden md:block w-px self-stretch bg-gray-200"></div>

                    {/* RIGHT COLUMN */}
                    <div className="flex-1 space-y-6">
                      {/* Change Password */}
                      <div className="space-y-4">
                        <h3 className="font-semibold text-[var(--ink)] flex items-center gap-1.5 border-b pb-2">
                          <Lock size={16} className="text-[var(--mute)]" />
                          Change Admin Password
                        </h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Leave blank to keep current"
                              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[var(--rule)] outline-none pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[var(--rule)] outline-none pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {message && (
                        <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {message.includes('success') ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
                          {message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t flex justify-end gap-3">
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                    >
                      <Save size={16} />
                      Save Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
