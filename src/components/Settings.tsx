import { type User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

import { toastError, toastSuccess } from "./ToastContext";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [_currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setName(data?.full_name || user.user_metadata?.full_name || "");
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name || null }).eq("id", user!.id);
    if (!error && name) {
      await supabase.auth.updateUser({ data: { full_name: name } });
    }
    setSaving(false);
    if (error) { toastError(error.message); return; }
    toastSuccess("Profile updated successfully!");
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toastError("Please fill in both password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toastError("Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) { toastError(error.message); return; }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePassword(false);
    toastSuccess("Password updated successfully!");
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="font-heading text-2xl sm:text-3xl text-amber-heading mb-8">SETTINGS</h1>

      <div className="space-y-6">
        <div className="p-5 rounded-xl border border-border-subtle bg-surface-card">
          <h2 className="font-heading text-base text-amber-heading mb-4">Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-label font-body block mb-1">Display Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                className="w-full bg-surface-input border border-border-input rounded-lg px-3 py-2 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
            </div>
            <div>
              <label className="text-xs text-text-label font-body block mb-1">Email</label>
              <div className="w-full bg-surface-subtle border border-border-strong-zinc rounded-lg px-3 py-2 text-sm text-text-label font-body">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl hover:from-amber-300 hover:to-amber-500 transition-all disabled:opacity-50">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border-subtle bg-surface-card">
          <h2 className="font-heading text-base text-amber-heading mb-4">Password</h2>

          {showChangePassword ? (
            <div className="space-y-3">
              <p className="text-xs text-text-muted font-body">Enter your new password below.</p>
              <div>
                <label className="text-xs text-text-label font-body block mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-surface-input border border-border-input rounded-lg px-3 py-2 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
              </div>
              <div>
                <label className="text-xs text-text-label font-body block mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-surface-input border border-border-input rounded-lg px-3 py-2 text-sm text-text-secondary font-body placeholder-text-placeholder outline-none focus:border-border-input-focus" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={handleChangePassword} disabled={passwordLoading} className="px-5 py-2.5 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl hover:from-amber-300 hover:to-amber-500 transition-all disabled:opacity-50">
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
                <button onClick={() => { setShowChangePassword(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }} className="px-4 py-2.5 text-sm font-body text-text-muted border border-border-strong-zinc rounded-lg hover:bg-zinc-800 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-text-muted font-body">Change your password directly. No email needed.</p>
              <button onClick={() => setShowChangePassword(true)} className="px-5 py-2.5 text-sm font-body font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl hover:from-amber-300 hover:to-amber-500 transition-all">
                Change Password
              </button>
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl border border-red-500/10 bg-surface-card">
          <h2 className="font-heading text-base text-red-400 mb-4">Account</h2>
          <button onClick={handleSignOut} className="px-5 py-2.5 text-sm font-body text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }
}
