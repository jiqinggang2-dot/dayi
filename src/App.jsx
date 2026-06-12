import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, ClipboardList, LogOut, Plus, RefreshCw, Save, Shield, UserPlus, Users } from "lucide-react";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { createCompanyUser, updateCompanyUser } from "./lib/adminApi";
import { canAccessModule, canEditRecord, canManageUsers, isSuperAdmin, visibleUsersForAssignment } from "./lib/permissions";
import { buildAlerts, groupReminders, reminderMessage } from "./lib/reminders";
import { i18n } from "./data/i18n";
import { MODULES, RISKS, STATUSES, accessibleModulesFor, labelFor, moduleById, optionLabel } from "./data/modules";

const emptyRecord = {
  title: "",
  module_id: "procurement",
  status: "not_started",
  risk: "medium",
  deadline: "",
  owner_user_id: "",
  approver_user_id: "",
  support_user_id: "",
  contingency: "",
  notes: "",
  data: {}
};

const emptyUser = {
  username: "",
  password: "",
  full_name: "",
  role_id: "procurement_manager",
  whatsapp: "",
  wechat: "",
  active: true
};

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function normalizeLoginIdentifier(value) {
  const trimmed = normalizeUsername(value);
  return trimmed.includes("@") ? trimmed : `${trimmed}@dayi.local`;
}

function displayAccount(user) {
  if (!user) return "";
  if (user.username) return user.username;
  return String(user.email || "").replace(/@dayi\.local$/i, "");
}

export default function App() {
  const [lang, setLang] = useState("en");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [view, setView] = useState("dashboard");
  const [moduleId, setModuleId] = useState("procurement");
  const [recordDraft, setRecordDraft] = useState(emptyRecord);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [userDraft, setUserDraft] = useState(emptyUser);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const t = i18n[lang];

  const accessibleModules = useMemo(() => accessibleModulesFor(profile), [profile]);
  const visibleRecords = useMemo(() => records.filter((record) => canAccessModule(profile, record.module_id) || canEditRecord(profile, record)), [records, profile]);
  const alerts = useMemo(() => buildAlerts(visibleRecords), [visibleRecords]);
  const reminderGroups = useMemo(() => groupReminders(visibleRecords, users), [visibleRecords, users]);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setStatus({ loading: false, error: "" });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStatus((current) => ({ ...current, loading: false }));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setRecords([]);
      setUsers([]);
      return;
    }
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function refreshData() {
    setStatus({ loading: true, error: "" });
    try {
      const { data: me, error: profileError } = await supabase
        .from("app_users")
        .select("*, role:app_roles(*)")
        .eq("auth_user_id", session.user.id)
        .eq("active", true)
        .single();
      if (profileError) throw profileError;

      const [{ data: roleRows, error: rolesError }, { data: userRows, error: usersError }, { data: recordRows, error: recordsError }] = await Promise.all([
        supabase.from("app_roles").select("*").order("sort_order"),
        supabase.from("app_users").select("*, role:app_roles(*)").order("full_name"),
        supabase.from("records").select("*, owner:app_users!records_owner_user_id_fkey(id,full_name,email), approver:app_users!records_approver_user_id_fkey(id,full_name,email), support:app_users!records_support_user_id_fkey(id,full_name,email)").order("updated_at", { ascending: false })
      ]);
      if (rolesError) throw rolesError;
      if (usersError) throw usersError;
      if (recordsError) throw recordsError;
      setProfile(me);
      setRoles(roleRows || []);
      setUsers(userRows || []);
      setRecords(recordRows || []);
      const firstModule = accessibleModulesFor(me)[0]?.id || "procurement";
      setModuleId((current) => (canAccessModule(me, current) ? current : firstModule));
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  async function signIn(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus({ loading: true, error: "" });
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizeLoginIdentifier(form.get("username")),
      password: form.get("password")
    });
    if (error) setStatus({ loading: false, error: error.message });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setView("dashboard");
  }

  function beginCreateRecord(selectedModuleId = moduleId) {
    setEditingRecordId(null);
    setRecordDraft({
      ...emptyRecord,
      module_id: selectedModuleId,
      owner_user_id: profile?.id || "",
      approver_user_id: "",
      support_user_id: ""
    });
    setView("recordForm");
  }

  function beginEditRecord(record) {
    setEditingRecordId(record.id);
    setRecordDraft({
      ...emptyRecord,
      ...record,
      data: record.data || {}
    });
    setView("recordForm");
  }

  async function saveRecord(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "" });
    const payload = {
      module_id: recordDraft.module_id,
      title: recordDraft.title,
      status: recordDraft.status,
      risk: recordDraft.risk,
      deadline: recordDraft.deadline || null,
      owner_user_id: recordDraft.owner_user_id || null,
      approver_user_id: recordDraft.approver_user_id || null,
      support_user_id: recordDraft.support_user_id || null,
      contingency: recordDraft.contingency,
      notes: recordDraft.notes,
      data: recordDraft.data || {},
      updated_by: profile.id
    };
    const query = editingRecordId
      ? supabase.from("records").update(payload).eq("id", editingRecordId)
      : supabase.from("records").insert({ ...payload, created_by: profile.id });
    const { error } = await query;
    if (error) {
      setStatus({ loading: false, error: error.message });
      return;
    }
    await refreshData();
    setView("records");
  }

  async function saveUser(event) {
    event.preventDefault();
    setStatus({ loading: true, error: "" });
    try {
      await createCompanyUser(userDraft);
      setUserDraft(emptyUser);
      await refreshData();
      setStatus({ loading: false, error: t.userCreated });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  async function changeUser(user, patch) {
    setStatus({ loading: true, error: "" });
    try {
      await updateCompanyUser({ id: user.id, ...patch });
      await refreshData();
      setStatus({ loading: false, error: t.userUpdated });
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="center-screen">
        <div className="setup-card">
          <Shield size={34} />
          <h1>{t.settingsNeeded}</h1>
          <p>{t.settingsCopy}</p>
          <p>{t.databaseNotice}</p>
          <p>{t.bootstrapNotice}</p>
        </div>
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <div className="login-screen">
        <form className="login-card" onSubmit={signIn}>
          <div className="brand-row">
            <div className="brand-mark">DY</div>
            <div>
              <strong>DA YI</strong>
              <span>{t.loginHint}</span>
            </div>
          </div>
          <h1>{t.loginTitle}</h1>
          <label>
            {t.username}
            <input name="username" required autoComplete="username" />
          </label>
          <label>
            {t.password}
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <div className="login-actions">
            <button className="primary-button" disabled={status.loading}>{status.loading ? t.loading : t.signIn}</button>
            <div className="language-row">
              <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
              <button type="button" className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button>
            </div>
          </div>
          {status.error && <div className="error-text">{status.error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row sidebar-brand">
          <div className="brand-mark">DY</div>
          <div>
            <strong>DA YI</strong>
            <span>{t.appTitle}</span>
          </div>
        </div>
        <NavButton icon={<ClipboardList />} active={view === "dashboard"} onClick={() => setView("dashboard")} label={t.dashboard} />
        <NavButton icon={<AlertTriangle />} active={view === "alerts"} onClick={() => setView("alerts")} label={t.alerts} />
        <NavButton icon={<Bell />} active={view === "reminders"} onClick={() => setView("reminders")} label={t.reminders} />
        {canManageUsers(profile) && <NavButton icon={<Users />} active={view === "users"} onClick={() => setView("users")} label={t.users} />}
        <div className="nav-title">{t.module}</div>
        {accessibleModules.map((module) => (
          <button key={module.id} className={`nav-item ${view === "records" && moduleId === module.id ? "active" : ""}`} onClick={() => { setModuleId(module.id); setView("records"); }}>
            <span>{module.index}</span>
            {labelFor(module, lang)}
          </button>
        ))}
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{pageTitle(view, moduleId, lang, t)}</h1>
            <p>{profile.full_name || displayAccount(profile)} | {labelForRole(profile.role, lang)} | {isSuperAdmin(profile) ? t.superAdmin : t.onlyVisibleData}</p>
          </div>
          <div className="top-actions">
            <div className="language-row inline">
              <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
              <button type="button" className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button>
            </div>
            <button className="ghost-button" onClick={refreshData}><RefreshCw size={16} /> Refresh</button>
            <button className="ghost-button" onClick={signOut}><LogOut size={16} /> {t.signOut}</button>
          </div>
        </header>

        {status.error && <div className={status.error === t.userCreated || status.error === t.userUpdated ? "success-banner" : "error-banner"}>{status.error}</div>}
        {view === "dashboard" && <Dashboard records={visibleRecords} alerts={alerts} t={t} lang={lang} />}
        {view === "alerts" && <Alerts alerts={alerts} lang={lang} users={users} />}
        {view === "reminders" && <Reminders groups={reminderGroups} lang={lang} t={t} />}
        {view === "records" && <Records moduleId={moduleId} records={visibleRecords.filter((record) => record.module_id === moduleId)} users={users} profile={profile} lang={lang} t={t} onCreate={() => beginCreateRecord(moduleId)} onEdit={beginEditRecord} />}
        {view === "recordForm" && <RecordForm draft={recordDraft} setDraft={setRecordDraft} users={visibleUsersForAssignment(users, profile)} profile={profile} roles={roles} lang={lang} t={t} onSubmit={saveRecord} onCancel={() => setView("records")} />}
        {view === "users" && canManageUsers(profile) && <UserManagement users={users} roles={roles} draft={userDraft} setDraft={setUserDraft} t={t} lang={lang} onSubmit={saveUser} onChangeUser={changeUser} />}
      </main>
    </div>
  );
}

function NavButton({ icon, active, onClick, label }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      {label}
    </button>
  );
}

function pageTitle(view, moduleId, lang, t) {
  if (view === "records") return labelFor(moduleById(moduleId), lang);
  if (view === "recordForm") return t.createRecord;
  if (view === "users") return t.users;
  return t[view] || t.dashboard;
}

function labelForRole(role, lang) {
  if (!role) return "";
  return lang === "zh" ? role.name_zh : role.name_en;
}

function Dashboard({ records, alerts, t, lang }) {
  const open = records.filter((record) => !["completed", "approved"].includes(record.status)).length;
  const critical = alerts.filter((alert) => alert.severity === "critical").length;
  return (
    <>
      <div className="metric-grid">
        <Metric label={t.records} value={records.length} tone="blue" />
        <Metric label={t.openItems} value={open} tone="green" />
        <Metric label={t.alerts} value={alerts.length} tone="amber" />
        <Metric label={t.critical} value={critical} tone="red" />
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2>{t.records}</h2>
        </div>
        <RecordTable records={records.slice(0, 8)} lang={lang} />
      </section>
    </>
  );
}

function Metric({ label, value, tone = "blue" }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span><i />{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Alerts({ alerts, users }) {
  return (
    <section className="panel">
      <div className="alert-list">
        {alerts.length ? alerts.map((alert, index) => (
          <div className={`alert-row ${alert.severity}`} key={`${alert.record.id}-${index}`}>
            <strong>{alert.record.title}</strong>
            <span>{alert.reason}</span>
            <em>{users.find((user) => user.id === alert.record.owner_user_id)?.full_name || "Unassigned"}</em>
          </div>
        )) : <div className="empty-state">No alerts.</div>}
      </div>
    </section>
  );
}

function Reminders({ groups, lang, t }) {
  async function copy(group) {
    await navigator.clipboard.writeText(reminderMessage(group, MODULES, lang));
  }

  return (
    <section className="panel">
      <div className="reminder-grid">
        {groups.length ? groups.map((group) => (
          <article className="reminder-card" key={group.owner?.id || group.score}>
            <div className="card-title-row">
              <div>
                <h3>{group.owner?.full_name || displayAccount(group.owner) || "Unassigned"}</h3>
                <p>{group.records.length} {t.openItems}</p>
              </div>
              <span className="pill red">{t.priority}: {group.score}</span>
            </div>
            <textarea readOnly value={reminderMessage(group, MODULES, lang)} />
            <button className="primary-button" onClick={() => copy(group)}>{t.copyReminder}</button>
          </article>
        )) : <div className="empty-state">No reminders.</div>}
      </div>
    </section>
  );
}

function Records({ moduleId, records, users, profile, lang, t, onCreate, onEdit }) {
  const module = moduleById(moduleId);
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{labelFor(module, lang)}</h2>
          <p>{t.onlyVisibleData}</p>
        </div>
        <button className="primary-button" onClick={onCreate}><Plus size={16} /> {t.createRecord}</button>
      </div>
      <RecordTable records={records} users={users} lang={lang} t={t} profile={profile} onEdit={onEdit} />
    </section>
  );
}

function RecordTable({ records, users = [], lang = "en", t = i18n.en, profile, onEdit }) {
  if (!records.length) return <div className="empty-state">No records.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t.title}</th>
            <th>{t.module}</th>
            <th>{t.status}</th>
            <th>{t.risk}</th>
            <th>{t.owner}</th>
            <th>{t.deadline}</th>
            {onEdit && <th></th>}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <strong>{record.title}</strong>
                <p>{record.notes}</p>
              </td>
              <td>{labelFor(moduleById(record.module_id), lang)}</td>
              <td><span className="pill blue">{optionLabel(STATUSES, record.status, lang)}</span></td>
              <td><span className={`pill ${record.risk === "critical" || record.risk === "high" ? "red" : "green"}`}>{optionLabel(RISKS, record.risk, lang)}</span></td>
              <td>{users.find((user) => user.id === record.owner_user_id)?.full_name || record.owner?.full_name || "-"}</td>
              <td>{record.deadline || "-"}</td>
              {onEdit && <td>{canEditRecord(profile, record) && <button className="small-button" onClick={() => onEdit(record)}>{t.save}</button>}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecordForm({ draft, setDraft, users, lang, t, onSubmit, onCancel }) {
  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="panel form-panel" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>{t.module}<select value={draft.module_id} onChange={(event) => update("module_id", event.target.value)}>{MODULES.map((module) => <option key={module.id} value={module.id}>{labelFor(module, lang)}</option>)}</select></label>
        <label>{t.title}<input value={draft.title} onChange={(event) => update("title", event.target.value)} required /></label>
        <label>{t.status}<select value={draft.status} onChange={(event) => update("status", event.target.value)}>{STATUSES.map((status) => <option key={status.id} value={status.id}>{labelFor(status, lang)}</option>)}</select></label>
        <label>{t.risk}<select value={draft.risk} onChange={(event) => update("risk", event.target.value)}>{RISKS.map((risk) => <option key={risk.id} value={risk.id}>{labelFor(risk, lang)}</option>)}</select></label>
        <UserSelect label={t.owner} value={draft.owner_user_id} users={users} onChange={(value) => update("owner_user_id", value)} />
        <UserSelect label={t.approver} value={draft.approver_user_id} users={users} onChange={(value) => update("approver_user_id", value)} />
        <UserSelect label={t.support} value={draft.support_user_id} users={users} onChange={(value) => update("support_user_id", value)} />
        <label>{t.deadline}<input type="date" value={draft.deadline || ""} onChange={(event) => update("deadline", event.target.value)} /></label>
        <label className="full">{t.contingency}<textarea value={draft.contingency || ""} onChange={(event) => update("contingency", event.target.value)} /></label>
        <label className="full">{t.notes}<textarea value={draft.notes || ""} onChange={(event) => update("notes", event.target.value)} /></label>
      </div>
      <div className="form-actions">
        <button type="button" className="ghost-button" onClick={onCancel}>{t.cancel}</button>
        <button className="primary-button"><Save size={16} /> {t.save}</button>
      </div>
    </form>
  );
}

function UserSelect({ label, value, users, onChange }) {
  return (
    <label>
      {label}
      <select value={value || ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">-</option>
        {users.map((user) => <option key={user.id} value={user.id}>{user.full_name || displayAccount(user)}</option>)}
      </select>
    </label>
  );
}

function UserManagement({ users, roles, draft, setDraft, t, lang, onSubmit, onChangeUser }) {
  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function resetPassword(user) {
    const password = window.prompt(`${t.resetPassword}: ${user.full_name || displayAccount(user)}`);
    if (password) onChangeUser(user, { password });
  }

  return (
    <div className="stack">
      <form className="panel form-panel" onSubmit={onSubmit}>
        <div className="panel-header">
          <div>
            <h2>{t.createUser}</h2>
            <p>{t.createUserHint}</p>
          </div>
          <button className="primary-button"><UserPlus size={16} /> {t.createUser}</button>
        </div>
        <div className="form-grid">
          <label>{t.username}<input value={draft.username} onChange={(event) => update("username", normalizeUsername(event.target.value))} required /></label>
          <label>{t.tempPassword}<input type="password" value={draft.password} onChange={(event) => update("password", event.target.value)} required /></label>
          <label>{t.fullName}<input value={draft.full_name} onChange={(event) => update("full_name", event.target.value)} required /></label>
          <label>{t.role}<select value={draft.role_id} onChange={(event) => update("role_id", event.target.value)}>{roles.filter((role) => !role.is_super_admin).map((role) => <option key={role.id} value={role.id}>{lang === "zh" ? role.name_zh : role.name_en}</option>)}</select></label>
          <label>{t.phone}<input value={draft.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} /></label>
          <label>{t.wechat}<input value={draft.wechat} onChange={(event) => update("wechat", event.target.value)} /></label>
        </div>
      </form>

      <section className="panel">
        <div className="user-grid">
          {users.map((user) => (
            <article className="user-card" key={user.id}>
              <div>
                <h3>{user.full_name || displayAccount(user)}</h3>
                <p>{displayAccount(user)}</p>
                <span className="pill blue">{labelForRole(user.role, lang)}</span>
              </div>
              <select value={user.role_id} disabled={user.role?.is_super_admin} onChange={(event) => onChangeUser(user, { role_id: event.target.value })}>
                {roles.map((role) => <option key={role.id} value={role.id}>{lang === "zh" ? role.name_zh : role.name_en}</option>)}
              </select>
              <button className="ghost-button" disabled={user.role?.is_super_admin} onClick={() => onChangeUser(user, { active: !user.active })}>
                {user.active ? t.active : t.inactive}
              </button>
              <button className="ghost-button" disabled={user.role?.is_super_admin} onClick={() => resetPassword(user)}>
                {t.resetPassword}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
