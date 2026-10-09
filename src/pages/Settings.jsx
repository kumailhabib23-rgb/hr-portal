import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  Globe2,
  KeyRound,
  LockKeyhole,
  Monitor,
  Palette,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useTheme } from "../context/useTheme";
import Card from "../components/Card";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const tabs = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
];

const readPreference = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const readCurrentUser = () => {
  try {
    const value = localStorage.getItem("user") || sessionStorage.getItem("user");
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};

function Settings() {
  const { darkMode, toggleTheme } = useTheme();
  const user = readCurrentUser();
  const settingsKey = `hr-settings-${user.id || user.email || "account"}`;
  const firstLastName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const [activeTab, setActiveTab] = useState("account");
  const [account, setAccount] = useState(() => readPreference(`${settingsKey}-account`, {
    displayName: user.name || user.full_name || firstLastName || "HR Admin",
    email: user.email || "",
    language: "English (US)",
    timeZone: "(UTC+05:00) Karachi",
  }));
  const [compactLayout, setCompactLayout] = useState(() =>
    readPreference(`${settingsKey}-appearance`, { compactLayout: true }).compactLayout
  );
  const [emailAlerts, setEmailAlerts] = useState(() =>
    readPreference(`${settingsKey}-notifications`, { emailAlerts: true, weeklySummary: true }).emailAlerts
  );
  const [weeklySummary, setWeeklySummary] = useState(() =>
    readPreference(`${settingsKey}-notifications`, { emailAlerts: true, weeklySummary: true }).weeklySummary
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);
  const [password, setPassword] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("compact-layout", compactLayout);
    localStorage.setItem(`${settingsKey}-appearance`, JSON.stringify({ compactLayout }));
  }, [compactLayout, settingsKey]);

  useEffect(() => {
    localStorage.setItem(`${settingsKey}-notifications`, JSON.stringify({ emailAlerts, weeklySummary }));
  }, [emailAlerts, weeklySummary, settingsKey]);

  const handleSave = () => {
    try {
      localStorage.setItem(`${settingsKey}-account`, JSON.stringify(account));
      localStorage.setItem(`${settingsKey}-appearance`, JSON.stringify({ compactLayout }));
      localStorage.setItem(`${settingsKey}-notifications`, JSON.stringify({ emailAlerts, weeklySummary }));
      setSaveError(false);
      setSaveMessage("Settings saved on this device.");
    } catch {
      setSaveError(true);
      setSaveMessage("Settings could not be saved in this browser.");
    }
    window.setTimeout(() => setSaveMessage(""), 2500);
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError(false);

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      setPasswordError(true);
      setPasswordMessage("Your session has expired. Please sign in again.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(password),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to change password.");
      }

      setPassword({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordMessage(data.message || "Password changed successfully.");
    } catch (error) {
      setPasswordError(true);
      setPasswordMessage(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const updateAccount = (field, value) => {
    setAccount((current) => ({ ...current, [field]: value }));
    setSaveMessage("");
  };

  return (
    <div className="settings-page min-h-screen bg-slate-50 p-5 text-slate-900 dark:bg-black dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">Workspace control</p>
            <h1 className="text-3xl font-black tracking-tight">Settings</h1>
            <p className="mt-2 text-sm text-slate-500">Manage your portal preferences and account security.</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
          >
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav aria-label="Settings sections" className="portal-card grid h-fit grid-cols-2 gap-1 p-2 lg:grid-cols-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <SettingsNav
                key={id}
                icon={<Icon className="h-4 w-4" />}
                label={label}
                active={activeTab === id}
                onClick={() => setActiveTab(id)}
              />
            ))}
          </nav>

          <div aria-live="polite" className="min-w-0">
            {saveMessage && (
              <p className={`mb-4 rounded-xl border px-4 py-3 text-sm ${saveError ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"}`}>
                {saveMessage}
              </p>
            )}

            {activeTab === "account" && (
              <SettingsCard icon={<UserRound />} title="Account preferences" subtitle="Manage your personal display preferences.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display name" value={account.displayName} onChange={(value) => updateAccount("displayName", value)} />
                  <Field label="Email address" value={account.email} type="email" readOnly />
                  <Field label="Language" value={account.language} onChange={(value) => updateAccount("language", value)} options={["English (US)", "English (UK)", "Urdu"]} />
                  <Field label="Time zone" value={account.timeZone} onChange={(value) => updateAccount("timeZone", value)} options={["(UTC+05:00) Karachi", "(UTC+00:00) London", "(UTC-05:00) New York"]} />
                </div>
              </SettingsCard>
            )}

            {activeTab === "appearance" && (
              <SettingsCard icon={<Palette />} title="Appearance" subtitle="Personalize how the portal looks on your device.">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <SettingRow icon={<Monitor />} title="Theme" description="Choose the color mode for your workspace.">
                    <div className="flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
                      <ModeButton label="Light" active={!darkMode} onClick={() => darkMode && toggleTheme()} />
                      <ModeButton label="Dark" active={darkMode} onClick={() => !darkMode && toggleTheme()} />
                    </div>
                  </SettingRow>
                  <SettingRow icon={<Globe2 />} title="Compact layout" description="Reduce page and card spacing across the portal.">
                    <Toggle label="Compact layout" checked={compactLayout} onChange={() => setCompactLayout((value) => !value)} />
                  </SettingRow>
                </div>
              </SettingsCard>
            )}

            {activeTab === "notifications" && (
              <SettingsCard icon={<Bell />} title="Notifications" subtitle="Choose which updates you want to receive.">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <SettingRow icon={<Bell />} title="Email alerts" description="Receive important account and workforce updates.">
                    <Toggle label="Email alerts" checked={emailAlerts} onChange={() => setEmailAlerts((value) => !value)} />
                  </SettingRow>
                  <SettingRow icon={<Check />} title="Weekly summary" description="Get a Monday overview of portal activity.">
                    <Toggle label="Weekly summary" checked={weeklySummary} onChange={() => setWeeklySummary((value) => !value)} />
                  </SettingRow>
                </div>
              </SettingsCard>
            )}

            {activeTab === "security" && (
              <SettingsCard icon={<ShieldCheck />} title="Security" subtitle="Update the password for your signed-in account.">
                <SettingRow icon={<LockKeyhole />} title="Change password" description="Use your current password to set a new one.">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{user.role || "Account"}</span>
                </SettingRow>
                <form className="mt-5 grid gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-2" onSubmit={handlePasswordChange}>
                  <Field label="Current password" type="password" autoComplete="current-password" value={password.current_password} onChange={(value) => setPassword((current) => ({ ...current, current_password: value }))} required />
                  <span className="hidden sm:block" />
                  <Field label="New password" type="password" autoComplete="new-password" value={password.new_password} onChange={(value) => setPassword((current) => ({ ...current, new_password: value }))} required />
                  <Field label="Confirm new password" type="password" autoComplete="new-password" value={password.confirm_password} onChange={(value) => setPassword((current) => ({ ...current, confirm_password: value }))} required />
                  {passwordMessage && (
                    <p className={`sm:col-span-2 text-sm ${passwordError ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-300"}`} role="status">
                      {passwordMessage}
                    </p>
                  )}
                  <button type="submit" disabled={passwordLoading} className="flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">
                    <KeyRound className="h-4 w-4" />
                    {passwordLoading ? "Updating password..." : "Update password"}
                  </button>
                </form>
              </SettingsCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsNav({ icon, label, active, onClick }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold transition ${active ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"}`}>
      <span className="h-4 w-4">{icon}</span>
      {label}
    </button>
  );
}

function SettingsCard({ icon, title, subtitle, children }) {
  return (
    <Card as="section" className="p-5 sm:p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">{icon}</div>
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Field({ label, value, onChange, type = "text", options, readOnly = false, autoComplete, required = false }) {
  const fieldClassName = "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 read-only:cursor-not-allowed read-only:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      <div className="relative">
        {options ? (
          <>
            <select value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClassName} appearance-none pr-10`}>
              {options.map((option) => <option key={option}>{option}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
          </>
        ) : (
          <input type={type} value={value} onChange={(event) => onChange?.(event.target.value)} readOnly={readOnly} autoComplete={autoComplete} required={required} className={fieldClassName} />
        )}
      </div>
    </label>
  );
}

function SettingRow({ icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">{icon}</span>
        <div className="min-w-0"><p className="text-xs font-bold">{title}</p><p className="mt-1 text-[10px] text-slate-400">{description}</p></div>
      </div>
      {children}
    </div>
  );
}

function ModeButton({ label, active, onClick }) {
  return <button type="button" onClick={onClick} className={`rounded-lg px-3 py-2 text-[10px] font-bold transition ${active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`}>{label}</button>;
}

function Toggle({ checked, onChange, label }) {
  return <button type="button" aria-label={label} aria-pressed={checked} onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`} /></button>;
}

export default Settings;