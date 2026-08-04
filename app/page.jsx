"use client";
// Seva Board — HKM Vizag. Self-hosted (Next.js + MongoDB) build.
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Flame, Utensils, Music2, BookOpen, Palette, PenLine, CalendarDays, Wrench,
  Flower2, HeartHandshake, Coins, Code2, Milk, Sprout, Plus, X, Check, Search,
  Trash2, Pencil, Users, LayoutGrid, ListTree, Download, Clock, AlertTriangle,
  CircleCheck, CircleDot, Circle, Settings, RefreshCw, ChevronRight, Sparkles,
  BarChart3, ChevronLeft, Repeat, MessageSquare, ListChecks, GripVertical,
  Moon, Sun, Send, Star, PartyPopper, Upload, Database, User, Filter, Mail,
  History as HistoryIcon, LogOut,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

/* ================= config ================= */
const SHARED_KEY = "sevaBoard:v2";
const LOCAL_KEY = "sevaBoard:me";

const ICONS = { Flame, Utensils, Music2, BookOpen, Palette, PenLine, CalendarDays, Wrench, Flower2, HeartHandshake, Coins, Code2, Milk, Sprout };
const ICON_NAMES = Object.keys(ICONS);

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n, base) => { const d = base ? new Date(base + "T00:00:00") : new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const DEFAULT_SEVAS = [
  { id: "s1", name: "Deity Worship", icon: "Flame", color: "#E08A1E" },
  { id: "s2", name: "Kitchen & Prasadam", icon: "Utensils", color: "#C2571E" },
  { id: "s3", name: "Kirtan & Bhajan", icon: "Music2", color: "#7A5AA8" },
  { id: "s4", name: "Book Distribution", icon: "BookOpen", color: "#2F6E8F" },
  { id: "s5", name: "Media & Design", icon: "Palette", color: "#B4478A" },
  { id: "s6", name: "Blog & Content", icon: "PenLine", color: "#3E7C5A" },
  { id: "s7", name: "Events & Festivals", icon: "CalendarDays", color: "#D4A017" },
  { id: "s8", name: "Cleaning & Maintenance", icon: "Wrench", color: "#6B7280" },
  { id: "s9", name: "Flower & Garland", icon: "Flower2", color: "#C94F7C" },
  { id: "s10", name: "Guest Services", icon: "HeartHandshake", color: "#2E8B8B" },
  { id: "s11", name: "Donations & Fundraising", icon: "Coins", color: "#A8721E" },
  { id: "s12", name: "Tech & Development", icon: "Code2", color: "#3B4A8F" },
  { id: "s13", name: "Goshala", icon: "Milk", color: "#8A6D3B" },
  { id: "s14", name: "Tulasi Seva", icon: "Sprout", color: "#4E7A52" },
];

const DEFAULT_MEMBERS = [
  { id: "m1", name: "Mukunda Das", role: "Coordinator", phone: "", email: "", sevaIds: ["s12", "s5", "s6"] },
  { id: "m2", name: "Volunteer (example)", role: "Sevak", phone: "", email: "", sevaIds: ["s2"] },
  { id: "m3", name: "Volunteer (example)", role: "Sevak", phone: "", email: "", sevaIds: ["s1", "s9"] },
];

const DEFAULT_FESTIVALS = [
  { id: "f1", name: "Janmashtami", color: "#7A5AA8", date: "" },
  { id: "f2", name: "Radhastami", color: "#C94F7C", date: "" },
];

const DEFAULT_TASKS = [
  { id: "t1", title: "Update Janmashtami donation banner", notes: "New UTM banner + theme colour on Subhojanam preset buttons.", sevaId: "s5", assigneeIds: ["m1"], priority: "important", status: "doing", due: addDays(2), festivalId: "f1", recurrence: null, subtasks: [{ id: "st1", text: "Design in Canva", done: true }, { id: "st2", text: "Upload to Cloudinary", done: false }, { id: "st3", text: "Wire UTM param", done: false }], comments: [], createdAt: Date.now(), completedAt: null },
  { id: "t2", title: "Cook & pack Annadana meals", notes: "Morning batch for government hospital distribution.", sevaId: "s2", assigneeIds: ["m2"], priority: "urgent", status: "todo", due: today(), festivalId: "", recurrence: { freq: "daily", interval: 1 }, subtasks: [], comments: [], createdAt: Date.now(), completedAt: null },
  { id: "t3", title: "Publish 'Our Acharyas' blog post", notes: "Rewrite reference article, add CMS fields, push live.", sevaId: "s6", assigneeIds: ["m1"], priority: "normal", status: "todo", due: addDays(4), festivalId: "", recurrence: null, subtasks: [], comments: [], createdAt: Date.now(), completedAt: null },
  { id: "t4", title: "Mangala aarti & deity dressing", notes: "Sri Radha Krishnachandra — daily seva.", sevaId: "s1", assigneeIds: ["m3"], priority: "normal", status: "done", due: today(), festivalId: "", recurrence: { freq: "daily", interval: 1 }, subtasks: [], comments: [], createdAt: Date.now(), completedAt: Date.now() },
  { id: "t5", title: "Sankirtan book stock check", notes: "Count remaining Bhagavad-gitas before weekend.", sevaId: "s4", assigneeIds: [], priority: "normal", status: "todo", due: addDays(-1), festivalId: "", recurrence: { freq: "weekly", interval: 1 }, subtasks: [], comments: [], createdAt: Date.now(), completedAt: null },
];

const STATUSES = [
  { id: "todo", label: "To Do", icon: Circle, color: "#6E664F" },
  { id: "doing", label: "In Progress", icon: CircleDot, color: "#D4A017" },
  { id: "done", label: "Completed", icon: CircleCheck, color: "#4E7A52" },
];
const PRIORITIES = [
  { id: "normal", label: "Normal", color: "#6E664F", rank: 0 },
  { id: "important", label: "Important", color: "#D4A017", rank: 1 },
  { id: "urgent", label: "Urgent", color: "#A83232", rank: 2 },
];
const RECUR = [
  { id: "", label: "Does not repeat" },
  { id: "daily", label: "Every day" },
  { id: "weekly", label: "Every week" },
  { id: "monthly", label: "Every month" },
];

/* ================= helpers ================= */
const uid = () => Math.random().toString(36).slice(2, 9);
const initials = (n) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "?";
const AV = ["#E08A1E", "#7A5AA8", "#2F6E8F", "#3E7C5A", "#C94F7C", "#2E8B8B", "#A8721E", "#3B4A8F"];
const colorFor = (id) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997; return AV[h % AV.length]; };
const isOverdue = (t) => t.status !== "done" && t.due && t.due < today();
const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
const fmtTime = (ts) => new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const advance = (d, r) => { if (!r || !r.freq) return d; const base = d || today(); if (r.freq === "daily") return addDays(1, base); if (r.freq === "weekly") return addDays(7, base); const x = new Date(base + "T00:00:00"); x.setMonth(x.getMonth() + 1); return x.toISOString().slice(0, 10); };

function normTask(t) {
  return {
    id: t.id || uid(), title: t.title || "", notes: t.notes || "", sevaId: t.sevaId || "",
    assigneeIds: t.assigneeIds || (t.assigneeId ? [t.assigneeId] : []),
    priority: t.priority || "normal", status: t.status || "todo", due: t.due || "",
    festivalId: t.festivalId || "", recurrence: t.recurrence || null,
    subtasks: t.subtasks || [], comments: t.comments || [],
    history: t.history || [],
    createdAt: t.createdAt || Date.now(), completedAt: t.completedAt || null,
  };
}

const HIST_ICONS = {
  created: Sparkles, status: CircleDot, assigned: Users, unassigned: Users,
  priority: AlertTriangle, due: Clock, seva: Flame, edited: Pencil, email: Mail, system: Repeat,
};

/* ================= persistence (self-hosted API, cookie session + localStorage prefs) ================= */
async function apiBoard(method, body) {
  return fetch("/api/board", {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function loadShared() {
  try {
    const res = await apiBoard("GET");
    if (res.status === 401) return { gate: true };
    const d = await res.json();
    return { data: d };
  } catch (e) { console.error(e); return { data: null, error: true }; }
}
async function saveShared(d) { try { await apiBoard("PUT", d); } catch (e) { console.error(e); } }
function loadLocalPrefs() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch (e) { return null; } }
function saveLocalPrefs(d) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(d)); } catch (e) {} }

async function msAuthCall(method) {
  return fetch("/api/auth/microsoft/status", { method, credentials: "same-origin" });
}
async function authCall(path, method, body) {
  return fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/* ============================================================= */
export default function SevaBoardPro() {
  const [sevas, setSevas] = useState(DEFAULT_SEVAS);
  const [members, setMembers] = useState(DEFAULT_MEMBERS);
  const [festivals, setFestivals] = useState(DEFAULT_FESTIVALS);
  const [tasks, setTasks] = useState(DEFAULT_TASKS.map(normTask));
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

  const [meId, setMeId] = useState("");
  const [theme, setTheme] = useState("light");
  const localLoaded = useRef(false);

  const [view, setView] = useState("board");
  const [q, setQ] = useState("");
  const [fSeva, setFSeva] = useState("all");
  const [fFest, setFFest] = useState("all");
  const [fAssignee, setFAssignee] = useState("all");
  const [mine, setMine] = useState(false);
  const [sort, setSort] = useState("due");

  const [taskModal, setTaskModal] = useState(null);
  const [manage, setManage] = useState(null);
  const [msStatus, setMsStatus] = useState({ connected: false, email: "" });
  const [toasts, setToasts] = useState([]);
  const toast = (msg) => { const id = uid(); setToasts((p) => [...p, { id, msg }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2600); };
  const [gate, setGate] = useState(false);
  const [session, setSession] = useState(null); // null = unknown, false = signed out, object = signed in
  const [needsSetup, setNeedsSetup] = useState(false);
  const saveTimer = useRef(null);
  const wsRef = useRef(null);
  const wsRetryRef = useRef(0);
  const savePendingRef = useRef(false); // a debounced save is scheduled or currently in flight
  const deferredRefetchRef = useRef(false); // a broadcast arrived while we were busy saving

  /* load */
  const applyBoard = (d) => {
    setSevas((d && d.sevas) || DEFAULT_SEVAS);
    setMembers((d && d.members) || DEFAULT_MEMBERS);
    setFestivals((d && d.festivals) || DEFAULT_FESTIVALS);
    setTasks(((d && d.tasks) || DEFAULT_TASKS).map(normTask));
  };
  const loadAll = async (silent) => {
    if (!silent) setLoading(true);
    const r = await loadShared();
    if (r.gate) { setGate(true); setSession(false); setLoading(false); return; }
    setGate(false);
    if (r.data) applyBoard(r.data);
    else {
      const seed = { sevas: DEFAULT_SEVAS, members: DEFAULT_MEMBERS, festivals: DEFAULT_FESTIVALS, tasks: DEFAULT_TASKS.map(normTask) };
      applyBoard(seed); await saveShared(seed);
    }
    loaded.current = true; setLoading(false);
  };

  const connectWs = () => {
    if (typeof window === "undefined") return;
    if (wsRef.current && (wsRef.current.readyState === 0 || wsRef.current.readyState === 1)) return; // already connecting/open
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/ws`;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => { wsRetryRef.current = 0; };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "board_updated") {
            // If we have unsaved local edits in flight, refetching now would overwrite them
            // with (briefly) stale server data and cancel their pending save. Defer instead —
            // the save's own completion handler will run this once it's actually safe to.
            if (savePendingRef.current) deferredRefetchRef.current = true;
            else loadAll(true);
          }
        } catch (e) {}
      };
      ws.onclose = () => {
        const delay = Math.min(1000 * 2 ** wsRetryRef.current, 15000);
        wsRetryRef.current += 1;
        setTimeout(connectWs, delay);
      };
      ws.onerror = () => { try { ws.close(); } catch (e) {} };
    } catch (e) {}
  };

  const checkSession = async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      const data = await res.json();
      if (data.authenticated) {
        setSession(data);
        setGate(false);
        setMeId((prev) => prev || data.memberId || "");
        loadAll();
        refreshMsStatus();
        connectWs();
      } else {
        setSession(false);
        setGate(true);
        setLoading(false);
        try {
          const initRes = await fetch("/api/auth/init");
          const initData = await initRes.json();
          setNeedsSetup(!!initData.needsSetup);
        } catch (e) {}
      }
    } catch (e) { setSession(false); setGate(true); setLoading(false); }
  };

  const login = async ({ email, password, name, setupPassword }) => {
    let res;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, setupPassword }),
      });
    } catch (e) {
      // fetch() itself threw — this is a genuine network failure (offline, DNS, etc.)
      return { ok: false, error: "network_error" };
    }

    let data = {};
    try { data = await res.json(); } catch (e) {
      // Server responded but not with JSON — surface the real status instead of hiding it.
      return { ok: false, error: `http_${res.status}` };
    }

    if (!res.ok) return { ok: false, error: data.error || `http_${res.status}`, detail: data.message };
    setSession(data);
    setGate(false);
    setMeId((prev) => prev || data.memberId || "");
    loadAll();
    refreshMsStatus();
    connectWs();
    return { ok: true };
  };

  const logout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (e) {}
    if (wsRef.current) { try { wsRef.current.onclose = null; wsRef.current.close(); } catch (e) {} wsRef.current = null; }
    setSession(false); setGate(true); setMeId(""); toast("Signed out");
  };

  useEffect(() => {
    const prefs = loadLocalPrefs();
    if (prefs) { setMeId(prefs.meId || ""); setTheme(prefs.theme || "light"); }
    localLoaded.current = true;
    checkSession();

    // Handle the redirect back from Microsoft's consent screen (?ms_connect=ok|error).
    const params = new URLSearchParams(window.location.search);
    const result = params.get("ms_connect");
    if (result === "ok") {
      const email = params.get("email");
      toast(email ? `Connected to Outlook as ${email}` : "Connected to Outlook");
      refreshMsStatus();
    } else if (result === "error") {
      const reason = params.get("reason");
      toast(reason === "login_required" ? "Please sign in first, then connect Outlook" : "Couldn't connect Outlook — try again");
    }
    if (result) {
      params.delete("ms_connect"); params.delete("email"); params.delete("reason");
      const q = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (q ? `?${q}` : ""));
    }
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    clearTimeout(saveTimer.current);
    savePendingRef.current = true;
    saveTimer.current = setTimeout(async () => {
      try { await saveShared({ sevas, members, festivals, tasks }); }
      finally {
        savePendingRef.current = false;
        if (deferredRefetchRef.current) { deferredRefetchRef.current = false; loadAll(true); }
      }
    }, 400);
  }, [sevas, members, festivals, tasks]);
  useEffect(() => { if (localLoaded.current) saveLocalPrefs({ meId, theme }); }, [meId, theme]);

  const refresh = () => { toast("Syncing…"); loadAll(); };
  const refreshMsStatus = async () => {
    try { const res = await msAuthCall("GET"); if (res.ok) setMsStatus(await res.json()); } catch (e) {}
  };
  const disconnectMs = async () => {
    try {
      const res = await msAuthCall("DELETE");
      if (res.ok) { setMsStatus({ connected: false }); toast("Disconnected Outlook account"); }
      else toast("Couldn't disconnect");
    } catch (e) { toast("Couldn't disconnect"); }
  };

  const sevaById = useMemo(() => Object.fromEntries(sevas.map((s) => [s.id, s])), [sevas]);
  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const festById = useMemo(() => Object.fromEntries(festivals.map((f) => [f.id, f])), [festivals]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let r = tasks.filter((t) => {
      if (fSeva !== "all" && t.sevaId !== fSeva) return false;
      if (fFest !== "all" && (t.festivalId || "none") !== fFest) return false;
      if (fAssignee !== "all" && !(fAssignee === "none" ? t.assigneeIds.length === 0 : t.assigneeIds.includes(fAssignee))) return false;
      if (mine && meId && !t.assigneeIds.includes(meId)) return false;
      if (ql && !(t.title.toLowerCase().includes(ql) || (t.notes || "").toLowerCase().includes(ql))) return false;
      return true;
    });
    const cmp = { due: (a, b) => (a.due || "9999").localeCompare(b.due || "9999"), priority: (a, b) => (PRIORITIES.find((p) => p.id === b.priority).rank - PRIORITIES.find((p) => p.id === a.priority).rank), created: (a, b) => b.createdAt - a.createdAt };
    return [...r].sort(cmp[sort]);
  }, [tasks, q, fSeva, fFest, fAssignee, mine, meId, sort]);

  const stats = useMemo(() => ({
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks]);

  /* ---- audit trail ---- */
  const actorName = () => memberById[meId]?.name || "Someone";
  const buildHistory = (prev, next) => {
    const h = [...(prev?.history || next.history || [])];
    const push = (type, text) => h.push({ id: uid(), ts: Date.now(), actor: actorName(), type, text });
    if (!prev) {
      push("created", "Task created");
      if (next.assigneeIds.length) push("assigned", `Assigned to ${next.assigneeIds.map((id) => memberById[id]?.name).filter(Boolean).join(", ")}`);
    } else {
      if (prev.status !== next.status) push("status", `Status changed to ${STATUSES.find((s) => s.id === next.status)?.label}`);
      const addedA = next.assigneeIds.filter((id) => !prev.assigneeIds.includes(id));
      const removedA = prev.assigneeIds.filter((id) => !next.assigneeIds.includes(id));
      if (addedA.length) push("assigned", `Assigned to ${addedA.map((id) => memberById[id]?.name).filter(Boolean).join(", ")}`);
      if (removedA.length) push("unassigned", `Unassigned from ${removedA.map((id) => memberById[id]?.name).filter(Boolean).join(", ")}`);
      if (prev.priority !== next.priority) push("priority", `Priority set to ${PRIORITIES.find((p) => p.id === next.priority)?.label}`);
      if (prev.due !== next.due) push("due", next.due ? `Due date set to ${fmtDate(next.due)}` : "Due date cleared");
      if (prev.sevaId !== next.sevaId) push("seva", `Seva changed to ${sevaById[next.sevaId]?.name || "—"}`);
      if (prev.title !== next.title) push("edited", "Title updated");
    }
    return h;
  };

  /* ---- email ---- */
  const sendEmail = async (task, member) => {
    if (!member?.email) { toast("Add an email for this devotee first"); return false; }
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: member.email, name: member.name, title: task.title, notes: task.notes, seva: sevaById[task.sevaId]?.name || "", due: task.due, priority: task.priority }),
      });
      if (res.ok) { toast(`Emailed ${member.name.split(" ")[0]}`); return true; }
      if (res.status === 501) toast("Email isn't configured yet — set up Microsoft 365 or Resend");
      else toast("Email failed to send");
      return false;
    } catch (e) { toast("Email failed to send"); return false; }
  };
  const logEmailSent = (id, member) => setTasks((p) => p.map((x) => (x.id === id ? { ...x, history: [...x.history, { id: uid(), ts: Date.now(), actor: actorName(), type: "email", text: `Email sent to ${member.name}` }] } : x)));
  const notifyEmail = async (task, member) => { const ok = await sendEmail(task, member); if (ok) logEmailSent(task.id, member); };

  /* mutations */
  const saveTask = (t) => {
    const prev = tasks.find((x) => x.id === t.id);
    const withHistory = { ...t, history: buildHistory(prev, t) };
    if (prev) setTasks((p) => p.map((x) => (x.id === t.id ? withHistory : x)));
    else setTasks((p) => [normTask(withHistory), ...p]);
    // Auto-email newly assigned devotees who have an email on file.
    const addedIds = withHistory.assigneeIds.filter((id) => !(prev?.assigneeIds || []).includes(id));
    addedIds.forEach((id) => { const m = memberById[id]; if (m?.email) notifyEmail(withHistory, m); });
    setTaskModal(null); toast("Task saved");
  };
  const delTask = (id) => { setTasks((p) => p.filter((x) => x.id !== id)); toast("Task deleted"); };
  const setStatus = (id, status) => setTasks((p) => {
    const t = p.find((x) => x.id === id);
    const hEntry = { id: uid(), ts: Date.now(), actor: actorName(), type: "status", text: `Status changed to ${STATUSES.find((s) => s.id === status)?.label}` };
    let next = p.map((x) => (x.id === id ? { ...x, status, completedAt: status === "done" ? Date.now() : null, history: [...x.history, hEntry] } : x));
    if (t && status === "done" && t.status !== "done" && t.recurrence?.freq) {
      const clone = normTask({ ...t, id: uid(), status: "todo", completedAt: null, due: advance(t.due, t.recurrence), comments: [], history: [{ id: uid(), ts: Date.now(), actor: "System", type: "system", text: "Recurring task auto-scheduled" }], subtasks: t.subtasks.map((s) => ({ ...s, id: uid(), done: false })), createdAt: Date.now() });
      next = [clone, ...next]; toast("Next occurrence scheduled");
    }
    return next;
  });
  const patchTask = (id, patch) => setTasks((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const notifyWhatsApp = (task, member) => {
    if (!member?.phone) { toast("Add a phone number for this devotee first"); return; }
    const seva = sevaById[task.sevaId]?.name || "";
    const msg = `Hare Krishna ${member.name} 🙏\n\nNew seva assigned: *${task.title}*\nSeva: ${seva}${task.due ? `\nDue: ${fmtDate(task.due)}` : ""}${task.notes ? `\n\n${task.notes}` : ""}`;
    window.open(`https://wa.me/${member.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const exportCSV = () => {
    const rows = [["Title", "Seva", "Assignees", "Festival", "Priority", "Status", "Due", "Repeats", "Notes"]];
    filtered.forEach((t) => rows.push([t.title, sevaById[t.sevaId]?.name || "", t.assigneeIds.map((i) => memberById[i]?.name).filter(Boolean).join("; ") || "Unassigned", festById[t.festivalId]?.name || "", t.priority, STATUSES.find((s) => s.id === t.status)?.label, t.due || "", t.recurrence?.freq || "no", (t.notes || "").replace(/\n/g, " ")]));
    dl(rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n"), "seva-board.csv", "text/csv");
    toast("CSV exported");
  };
  const exportJSON = () => { dl(JSON.stringify({ sevas, members, festivals, tasks }, null, 2), "seva-board-backup.json", "application/json"); toast("Backup exported"); };
  const importJSON = (file) => { const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (d.tasks) setTasks(d.tasks.map(normTask)); if (d.sevas) setSevas(d.sevas); if (d.members) setMembers(d.members); if (d.festivals) setFestivals(d.festivals); toast("Backup restored"); } catch (e) { toast("Could not read that file"); } }; r.readAsText(file); };

  /* keyboard */
  const isSuperAdmin = session && session.role === "super_admin";
  const isAdmin = session && (session.role === "admin" || session.role === "super_admin");
  useEffect(() => {
    const h = (e) => { if (isAdmin && e.key === "n" && !taskModal && !manage && !/input|textarea|select/i.test(e.target.tagName)) { e.preventDefault(); setTaskModal({}); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [taskModal, manage, isAdmin]);

  const shared = { sevaById, memberById, festById, members, setStatus, setTaskModal, delTask, patchTask, meId, notifyWhatsApp, notifyEmail, isAdmin };

  if (gate) return <LoginGate theme={theme} needsSetup={needsSetup} onLogin={login} />;

  return (
    <div className={`sb-root ${theme === "dark" ? "dark" : ""}`}>
      <Styles />
      <header className="sb-head">
        <div className="sb-toran" aria-hidden="true">{Array.from({ length: 32 }).map((_, i) => <span key={i} style={{ animationDelay: `${i * 35}ms` }} />)}</div>
        <div className="sb-head-in">
          <div className="sb-brand">
            <div className="sb-mark"><Sparkles size={18} /></div>
            <div><h1>Seva Board</h1><p>Hare Krishna Movement, Visakhapatnam</p></div>
          </div>
          <div className="sb-head-actions">
            {session && (
              <button className="sb-profile-btn" onClick={() => setManage("profile")} title="My profile">
                <span className="sb-av" style={{ background: colorFor(session.email) }}>{initials(session.name || session.email)}</span>
                <span className="sb-profile-label">{session.name || session.email}<em>{roleLabel(session.role)}</em></span>
              </button>
            )}
            {!session?.memberId && (
              <select className="sb-me" value={meId} onChange={(e) => setMeId(e.target.value)} title="Who are you?">
                <option value="">I am…</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
            <button className="sb-btn ghost icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle evening mode">{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}</button>
            <button className="sb-btn ghost icon" onClick={refresh} title="Sync"><RefreshCw size={15} className={loading ? "sb-spin" : ""} /></button>
            {isAdmin && (
              <Dropdown label={<><Database size={15} /> Backup</>}>
                <button onClick={exportCSV}><Download size={14} /> Export CSV</button>
                <button onClick={exportJSON}><Download size={14} /> Export JSON</button>
                <label className="sb-file"><Upload size={14} /> Import JSON<input type="file" accept="application/json" onChange={(e) => e.target.files[0] && importJSON(e.target.files[0])} /></label>
              </Dropdown>
            )}
            {isAdmin && (
              <Dropdown label={<><Settings size={15} /> Manage</>}>
                <button onClick={() => setManage("team")}><Users size={14} /> Team</button>
                <button onClick={() => setManage("sevas")}><Flame size={14} /> Sevas</button>
                <button onClick={() => setManage("festivals")}><PartyPopper size={14} /> Festivals</button>
                <button onClick={() => setManage("email")}><Mail size={14} /> Email account</button>
                <button onClick={() => setManage("logins")}><User size={14} /> Logins</button>
              </Dropdown>
            )}
            <button className="sb-btn ghost icon" onClick={logout} title="Sign out"><LogOut size={15} /></button>
            {isAdmin && <button className="sb-btn primary" onClick={() => setTaskModal({})}><Plus size={16} /> New task</button>}
          </div>
        </div>
      </header>

      <div className="sb-stats">
        <Stat label="To Do" value={stats.todo} tone="#8a8262" icon={Circle} />
        <Stat label="In Progress" value={stats.doing} tone="#D4A017" icon={CircleDot} />
        <Stat label="Completed" value={stats.done} tone="#4E7A52" icon={CircleCheck} />
        <Stat label="Overdue" value={stats.overdue} tone="#A83232" icon={AlertTriangle} alert={stats.overdue > 0} />
      </div>

      <div className="sb-toolbar">
        <div className="sb-search"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" /></div>
        <select value={fSeva} onChange={(e) => setFSeva(e.target.value)} className="sb-select"><option value="all">All sevas</option>{sevas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={fFest} onChange={(e) => setFFest(e.target.value)} className="sb-select"><option value="all">All festivals</option><option value="none">No festival</option>{festivals.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className="sb-select"><option value="all">Anyone</option><option value="none">Unassigned</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <button className={`sb-chip-btn ${mine ? "on" : ""}`} onClick={() => setMine((v) => !v)} disabled={!meId} title={meId ? "" : "Pick who you are first"}><Star size={13} /> Mine</button>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="sb-select"><option value="due">Sort: Due date</option><option value="priority">Sort: Priority</option><option value="created">Sort: Newest</option></select>
        <div className="sb-views">
          {[["board", "Board", LayoutGrid], ["seva", "Seva", ListTree], ["person", "Person", Users], ["calendar", "Calendar", CalendarDays], ["analytics", "Insights", BarChart3]].map(([id, lbl, Ic]) => (
            <button key={id} className={`sb-viewbtn ${view === id ? "on" : ""}`} onClick={() => setView(id)}><Ic size={14} /><span className="sb-viewlbl">{lbl}</span></button>
          ))}
        </div>
      </div>

      <main className="sb-main">
        {view === "board" && <BoardView tasks={filtered} {...shared} />}
        {view === "seva" && <GroupView tasks={filtered} groups={sevas.map((s) => ({ key: s.id, label: s.name, color: s.color, icon: s.icon, match: (t) => t.sevaId === s.id }))} {...shared} />}
        {view === "person" && <PersonView tasks={filtered} members={members} {...shared} />}
        {view === "calendar" && <CalendarView tasks={filtered} {...shared} />}
        {view === "analytics" && <Analytics tasks={tasks} sevas={sevas} members={members} />}
      </main>

      {taskModal && <TaskModal task={taskModal} sevas={sevas} members={members} festivals={festivals} meId={meId} isAdmin={isAdmin} onSave={saveTask} onClose={() => setTaskModal(null)} onDelete={isAdmin && taskModal.id ? () => { delTask(taskModal.id); setTaskModal(null); } : null} onNotify={notifyWhatsApp} onEmail={notifyEmail} />}
      {manage === "team" && <TeamModal members={members} sevas={sevas} setMembers={setMembers} onClose={() => setManage(null)} />}
      {manage === "sevas" && <SevaAdminModal sevas={sevas} setSevas={setSevas} tasks={tasks} onClose={() => setManage(null)} />}
      {manage === "festivals" && <FestivalModal festivals={festivals} setFestivals={setFestivals} tasks={tasks} onClose={() => setManage(null)} />}
      {manage === "email" && <EmailAccountModal status={msStatus} onDisconnect={disconnectMs} onRefresh={refreshMsStatus} onClose={() => setManage(null)} />}
      {manage === "logins" && <LoginsModal members={members} isSuperAdmin={isSuperAdmin} onClose={() => setManage(null)} toast={toast} />}
      {manage === "profile" && (
        <ProfileModal
          session={session} members={members} isAdmin={isAdmin} toast={toast}
          onClose={() => setManage(null)}
          onUpdated={(patch) => { setSession((s) => ({ ...s, ...patch })); if ("memberId" in patch) setMeId(patch.memberId || ""); }}
          onLogout={() => { setManage(null); logout(); }}
        />
      )}

      <div className="sb-toasts">{toasts.map((t) => <div key={t.id} className="sb-toast"><Check size={14} /> {t.msg}</div>)}</div>
      <footer className="sb-foot">Shared across everyone who opens this board · press <kbd>N</kbd> for a new task · भक्त्या सेवते</footer>
    </div>
  );
}

/* ================= small components ================= */
function Stat({ label, value, tone, icon: Ic, alert }) {
  return <div className={`sb-stat ${alert ? "alert" : ""}`} style={{ "--tone": tone }}><Ic size={16} /><span className="sb-stat-val">{value}</span><span className="sb-stat-lbl">{label}</span></div>;
}

function Dropdown({ label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div className="sb-dd" ref={ref}>
      <button className="sb-btn ghost" onClick={() => setOpen((v) => !v)}>{label}</button>
      {open && <div className="sb-dd-menu" onClick={() => setOpen(false)}>{children}</div>}
    </div>
  );
}

function Avatars({ ids, memberById }) {
  const show = ids.slice(0, 3);
  return (
    <div className="sb-avstack">
      {show.map((id) => { const m = memberById[id]; return m ? <span key={id} className="sb-av" style={{ background: colorFor(id) }} title={m.name}>{initials(m.name)}</span> : null; })}
      {ids.length > 3 && <span className="sb-av more">+{ids.length - 3}</span>}
      {ids.length === 0 && <span className="sb-av-name muted">Unassigned</span>}
    </div>
  );
}

/* ================= task card ================= */
function TaskCard({ task, sevaById, memberById, festById, setStatus, setTaskModal, delTask, draggable, isAdmin }) {
  const seva = sevaById[task.sevaId]; const fest = festById[task.festivalId];
  const pr = PRIORITIES.find((p) => p.id === task.priority); const over = isOverdue(task);
  const doneSub = task.subtasks.filter((s) => s.done).length;
  const onDrag = (e) => { e.dataTransfer.setData("text/plain", task.id); e.dataTransfer.effectAllowed = "move"; };
  return (
    <div className={`sb-card ${task.status === "done" ? "done" : ""}`} style={{ "--seva": seva?.color || "#999" }} draggable={draggable} onDragStart={draggable ? onDrag : undefined}>
      <div className="sb-card-top">
        <div className="sb-chips">
          <span className="sb-chip" style={{ "--c": seva?.color }}>{seva && ICONS[seva.icon] && React.createElement(ICONS[seva.icon], { size: 11 })}{seva?.name || "No seva"}</span>
          {fest && <span className="sb-chip fest" style={{ "--c": fest.color }}><PartyPopper size={10} />{fest.name}</span>}
          {task.recurrence?.freq && <span className="sb-chip rep"><Repeat size={10} /></span>}
        </div>
        <div className="sb-card-tools">
          <button onClick={() => setTaskModal(task)} title={isAdmin ? "Edit" : "View"}>{isAdmin ? <Pencil size={13} /> : <ChevronRight size={13} />}</button>
          {isAdmin && <button onClick={() => delTask(task.id)} title="Delete"><Trash2 size={13} /></button>}
        </div>
      </div>
      <h4 onClick={() => setTaskModal(task)}>{task.title}</h4>
      {task.notes && <p className="sb-card-notes">{task.notes}</p>}
      {task.subtasks.length > 0 && (
        <div className="sb-subbar"><ListChecks size={12} /><div className="sb-progress"><span style={{ width: `${(doneSub / task.subtasks.length) * 100}%` }} /></div><em>{doneSub}/{task.subtasks.length}</em></div>
      )}
      {task.comments.length > 0 && <div className="sb-cmtcount"><MessageSquare size={11} /> {task.comments.length}</div>}
      <div className="sb-card-bot">
        <Avatars ids={task.assigneeIds} memberById={memberById} />
        <div className="sb-card-meta">
          {task.priority !== "normal" && <span className="sb-pr" style={{ color: pr.color, borderColor: pr.color }}>{pr.label}</span>}
          {task.due && <span className={`sb-due ${over ? "over" : ""}`}><Clock size={11} /> {fmtDate(task.due)}</span>}
        </div>
      </div>
      <select className="sb-status" value={task.status} onChange={(e) => setStatus(task.id, e.target.value)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
    </div>
  );
}
const renderCards = (tasks, shared, draggable) => tasks.map((t) => <TaskCard key={t.id} task={t} draggable={draggable} {...shared} />);
const Empty = ({ text }) => <div className="sb-empty"><ChevronRight size={16} /> {text}</div>;

/* ================= views ================= */
function BoardView(props) {
  const { tasks, setStatus } = props;
  const [over, setOver] = useState(null);
  return (
    <div className="sb-columns">
      {STATUSES.map((s) => {
        const col = tasks.filter((t) => t.status === s.id);
        return (
          <section key={s.id} className={`sb-col ${over === s.id ? "dragover" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOver(s.id); }} onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) setStatus(id, s.id); setOver(null); }}>
            <header className="sb-col-head" style={{ "--tone": s.color }}><s.icon size={15} /> {s.label} <span className="sb-count">{col.length}</span></header>
            <div className="sb-col-body">{col.length ? renderCards(col, props, true) : <Empty text="Drop tasks here" />}</div>
          </section>
        );
      })}
    </div>
  );
}

function GroupView({ tasks, groups, ...shared }) {
  const active = groups.filter((g) => tasks.some(g.match));
  if (!active.length) return <Empty text="No tasks match your filters" />;
  return (
    <div className="sb-groups">
      {active.map((g) => {
        const list = tasks.filter(g.match);
        return (
          <section key={g.key} className="sb-group">
            <header className="sb-group-head" style={{ "--c": g.color }}>{g.icon && ICONS[g.icon] && React.createElement(ICONS[g.icon], { size: 16 })}{g.label} <span className="sb-count">{list.length}</span></header>
            <div className="sb-grid">{renderCards(list, shared, false)}</div>
          </section>
        );
      })}
    </div>
  );
}

function PersonView({ tasks, members, ...shared }) {
  const groups = [...members.map((m) => ({ m, list: tasks.filter((t) => t.assigneeIds.includes(m.id)) })), { m: null, list: tasks.filter((t) => t.assigneeIds.length === 0) }].filter((g) => g.list.length || g.m);
  return (
    <div className="sb-groups">
      {groups.map((g) => {
        const openN = g.list.filter((t) => t.status !== "done").length;
        return (
          <section key={g.m?.id || "none"} className="sb-group">
            <header className="sb-group-head person">
              {g.m ? <span className="sb-av lg" style={{ background: colorFor(g.m.id) }}>{initials(g.m.name)}</span> : <span className="sb-av lg muted-av">?</span>}
              <span>{g.m?.name || "Unassigned"}</span>{g.m?.role && <span className="sb-role">{g.m.role}</span>}<span className="sb-count">{openN} open</span>
            </header>
            <div className="sb-grid">{g.list.length ? renderCards(g.list, shared, false) : <Empty text="No tasks assigned" />}</div>
          </section>
        );
      })}
    </div>
  );
}

function CalendarView({ tasks, sevaById, festById, setTaskModal, ...shared }) {
  const [cur, setCur] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const first = new Date(cur.y, cur.m, 1);
  const startPad = first.getDay();
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const monthName = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const tasksOn = (day) => { const ds = new Date(cur.y, cur.m, day).toISOString().slice(0, 10); return tasks.filter((t) => t.due === ds); };
  const move = (d) => setCur((c) => { let m = c.m + d, y = c.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });
  return (
    <div className="sb-cal">
      <div className="sb-cal-head">
        <button className="sb-icon-btn" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
        <h3>{monthName}</h3>
        <button className="sb-icon-btn" onClick={() => move(1)}><ChevronRight size={18} /></button>
        <button className="sb-btn ghost sm" onClick={() => { const d = new Date(); setCur({ y: d.getFullYear(), m: d.getMonth() }); }}>Today</button>
      </div>
      <div className="sb-cal-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="sb-cal-dow">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="sb-cal-cell empty" />;
          const ds = new Date(cur.y, cur.m, day).toISOString().slice(0, 10);
          const list = tasksOn(day); const isToday = ds === today();
          return (
            <div key={i} className={`sb-cal-cell ${isToday ? "today" : ""}`}>
              <span className="sb-cal-num">{day}</span>
              <div className="sb-cal-tasks">
                {list.slice(0, 4).map((t) => { const s = sevaById[t.sevaId]; return <button key={t.id} className={`sb-cal-task ${t.status === "done" ? "done" : ""} ${isOverdue(t) ? "over" : ""}`} style={{ "--c": s?.color || "#999" }} onClick={() => setTaskModal(t)} title={t.title}>{t.title}</button>; })}
                {list.length > 4 && <span className="sb-cal-more">+{list.length - 4} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Analytics({ tasks, sevas, members }) {
  const statusData = STATUSES.map((s) => ({ name: s.label, value: tasks.filter((t) => t.status === s.id).length, fill: s.color }));
  const total = tasks.length; const done = tasks.filter((t) => t.status === "done").length;
  const rate = total ? Math.round((done / total) * 100) : 0;
  const perSeva = sevas.map((s) => ({ name: s.name.split(" ")[0], full: s.name, color: s.color, count: tasks.filter((t) => t.sevaId === s.id && t.status !== "done").length })).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  const perPerson = [...members.map((m) => ({ name: m.name.split(" ")[0], full: m.name, count: tasks.filter((t) => t.assigneeIds.includes(m.id) && t.status !== "done").length })), { name: "Unassigned", full: "Unassigned", count: tasks.filter((t) => t.assigneeIds.length === 0 && t.status !== "done").length }].filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  const overdue = tasks.filter(isOverdue).length;
  const weekAhead = tasks.filter((t) => t.status !== "done" && t.due && t.due >= today() && t.due <= addDays(7)).length;
  return (
    <div className="sb-analytics">
      <div className="sb-a-top">
        <div className="sb-a-donut">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={2}>{statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div className="sb-donut-center"><strong>{rate}%</strong><span>completed</span></div>
        </div>
        <div className="sb-a-mini">
          <MiniStat n={total} label="Total tasks" c="#3B4A8F" />
          <MiniStat n={done} label="Completed" c="#4E7A52" />
          <MiniStat n={overdue} label="Overdue" c="#A83232" />
          <MiniStat n={weekAhead} label="Due in 7 days" c="#D4A017" />
        </div>
      </div>
      <div className="sb-a-charts">
        <div className="sb-a-card">
          <h4>Open tasks by seva</h4>
          {perSeva.length ? <ResponsiveContainer width="100%" height={Math.max(160, perSeva.length * 34)}><BarChart data={perSeva} layout="vertical" margin={{ left: 10, right: 20 }}><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} /><Tooltip formatter={(v, n, p) => [v, p.payload.full]} /><Bar dataKey="count" radius={[0, 5, 5, 0]}>{perSeva.map((d, i) => <Cell key={i} fill={d.color} />)}</Bar></BarChart></ResponsiveContainer> : <Empty text="No open tasks" />}
        </div>
        <div className="sb-a-card">
          <h4>Workload by devotee</h4>
          {perPerson.length ? <ResponsiveContainer width="100%" height={Math.max(160, perPerson.length * 34)}><BarChart data={perPerson} layout="vertical" margin={{ left: 10, right: 20 }}><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12 }} /><Tooltip formatter={(v, n, p) => [v, p.payload.full]} /><Bar dataKey="count" radius={[0, 5, 5, 0]} fill="#E08A1E" /></BarChart></ResponsiveContainer> : <Empty text="No open tasks" />}
        </div>
      </div>
    </div>
  );
}
const MiniStat = ({ n, label, c }) => <div className="sb-mini" style={{ "--c": c }}><strong>{n}</strong><span>{label}</span></div>;

/* ================= task modal ================= */
function TaskModal({ task, sevas, members, festivals, meId, isAdmin, onSave, onClose, onDelete, onNotify, onEmail }) {
  const [f, setF] = useState(() => normTask({ ...task, sevaId: task.sevaId || sevas[0]?.id || "" }));
  const [cmt, setCmt] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const eligible = members.filter((m) => !f.sevaId || m.sevaIds.includes(f.sevaId));
  const others = members.filter((m) => !eligible.includes(m));
  const toggleAssignee = (id) => { if (!isAdmin) return; set("assigneeIds", f.assigneeIds.includes(id) ? f.assigneeIds.filter((x) => x !== id) : [...f.assigneeIds, id]); };
  const addSub = () => set("subtasks", [...f.subtasks, { id: uid(), text: "", done: false }]);
  const setSub = (id, patch) => set("subtasks", f.subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const delSub = (id) => set("subtasks", f.subtasks.filter((s) => s.id !== id));
  const addComment = () => { if (!cmt.trim()) return; const author = members.find((m) => m.id === meId)?.name || "Someone"; set("comments", [...f.comments, { id: uid(), author, text: cmt.trim(), ts: Date.now() }]); setCmt(""); };
  const assignedMembers = f.assigneeIds.map((id) => members.find((m) => m.id === id)).filter(Boolean);

  return (
    <Modal onClose={onClose} title={task.id ? "Task details" : "New task"} wide>
      {!isAdmin && <p className="sb-hint" style={{ marginBottom: 12 }}>You can update status, tick off steps, and add comments. Only admins can edit the task's details.</p>}
      <label className="sb-field"><span>Task</span><input autoFocus={isAdmin} disabled={!isAdmin} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Prepare Ekadashi prasadam" /></label>
      <label className="sb-field"><span>Details</span><textarea rows={2} disabled={!isAdmin} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any instructions…" /></label>
      <div className="sb-row2">
        <label className="sb-field"><span>Seva</span><select disabled={!isAdmin} value={f.sevaId} onChange={(e) => set("sevaId", e.target.value)}>{sevas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="sb-field"><span>Festival</span><select disabled={!isAdmin} value={f.festivalId} onChange={(e) => set("festivalId", e.target.value)}><option value="">None</option>{festivals.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      </div>
      <div className="sb-field"><span>Assign to</span>
        <div className="sb-assign-pick">
          {eligible.map((m) => <button key={m.id} disabled={!isAdmin} className={`sb-tag ${f.assigneeIds.includes(m.id) ? "on" : ""}`} style={{ "--c": colorFor(m.id) }} onClick={() => toggleAssignee(m.id)}>{m.name}</button>)}
          {others.length > 0 && <span className="sb-tag-div">others</span>}
          {others.map((m) => <button key={m.id} disabled={!isAdmin} className={`sb-tag ${f.assigneeIds.includes(m.id) ? "on" : ""}`} style={{ "--c": colorFor(m.id) }} onClick={() => toggleAssignee(m.id)}>{m.name}</button>)}
        </div>
      </div>
      <div className="sb-row3">
        <label className="sb-field"><span>Priority</span><select disabled={!isAdmin} value={f.priority} onChange={(e) => set("priority", e.target.value)}>{PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <label className="sb-field"><span>Status</span><select value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        <label className="sb-field"><span>Due date</span><input type="date" disabled={!isAdmin} value={f.due} onChange={(e) => set("due", e.target.value)} /></label>
      </div>
      <label className="sb-field"><span><Repeat size={12} /> Repeats</span><select disabled={!isAdmin} value={f.recurrence?.freq || ""} onChange={(e) => set("recurrence", e.target.value ? { freq: e.target.value, interval: 1 } : null)}>{RECUR.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select></label>

      <div className="sb-section">
        <div className="sb-section-head"><span><ListChecks size={14} /> Checklist</span>{isAdmin && <button className="sb-mini-add" onClick={addSub}><Plus size={13} /> Add step</button>}</div>
        {f.subtasks.map((s) => (
          <div key={s.id} className="sb-sub-row">
            <button className={`sb-check ${s.done ? "on" : ""}`} onClick={() => setSub(s.id, { done: !s.done })}>{s.done && <Check size={12} />}</button>
            <input value={s.text} disabled={!isAdmin} onChange={(e) => setSub(s.id, { text: e.target.value })} placeholder="Step…" className={s.done ? "done" : ""} />
            {isAdmin && <button className="sb-icon-btn" onClick={() => delSub(s.id)}><X size={14} /></button>}
          </div>
        ))}
        {!f.subtasks.length && <p className="sb-hint">Break the seva into steps the devotee can tick off.</p>}
      </div>

      <div className="sb-section">
        <div className="sb-section-head"><span><MessageSquare size={14} /> Notes & updates</span></div>
        {f.comments.map((c) => <div key={c.id} className="sb-cmt"><strong>{c.author}</strong> <em>{fmtTime(c.ts)}</em><p>{c.text}</p></div>)}
        <div className="sb-cmt-add">
          <input value={cmt} onChange={(e) => setCmt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} placeholder={meId ? "Add an update…" : "Pick who you are to comment"} disabled={!meId} />
          <button className="sb-btn primary sm" onClick={addComment} disabled={!meId || !cmt.trim()}><Send size={13} /></button>
        </div>
      </div>

      {isAdmin && assignedMembers.some((m) => m.phone) && (
        <div className="sb-notify"><span>Notify on WhatsApp:</span>{assignedMembers.filter((m) => m.phone).map((m) => <button key={m.id} className="sb-wa" onClick={() => onNotify(f, m)}><Send size={12} /> {m.name.split(" ")[0]}</button>)}</div>
      )}
      {isAdmin && assignedMembers.some((m) => m.email) && (
        <div className="sb-notify email"><span>Email seva assignment:</span>{assignedMembers.filter((m) => m.email).map((m) => <button key={m.id} className="sb-mailbtn" onClick={() => onEmail(f, m)}><Mail size={12} /> {m.name.split(" ")[0]}</button>)}</div>
      )}

      <div className="sb-section">
        <div className="sb-section-head"><span><HistoryIcon size={14} /> Activity & tracking</span></div>
        {f.history.length ? (
          <div className="sb-timeline">
            {[...f.history].sort((a, b) => b.ts - a.ts).map((h) => {
              const Ic = HIST_ICONS[h.type] || HistoryIcon;
              return (
                <div key={h.id} className={`sb-tl-row ${h.type}`}>
                  <span className="sb-tl-dot"><Ic size={11} /></span>
                  <div className="sb-tl-body"><p><strong>{h.actor}</strong> {h.text}</p><em>{fmtTime(h.ts)}</em></div>
                </div>
              );
            })}
          </div>
        ) : <p className="sb-hint">Every status change, assignment and edit will be tracked here, from creation to completion.</p>}
      </div>

      <div className="sb-modal-foot">
        {onDelete && <button className="sb-btn danger" onClick={onDelete}><Trash2 size={14} /> Delete</button>}
        <div className="sb-spacer" />
        <button className="sb-btn ghost" onClick={onClose}>Cancel</button>
        <button className="sb-btn primary" disabled={!f.title.trim()} onClick={() => onSave({ ...f, title: f.title.trim() })}><Check size={15} /> {task.id ? "Save" : "Add task"}</button>
      </div>
    </Modal>
  );
}

/* ================= team modal ================= */
function TeamModal({ members, sevas, setMembers, onClose }) {
  const [name, setName] = useState(""); const [role, setRole] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [sel, setSel] = useState([]);
  const toggle = (id) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const add = () => { if (!name.trim()) return; setMembers((p) => [...p, { id: uid(), name: name.trim(), role: role.trim() || "Sevak", phone: phone.trim(), email: email.trim(), sevaIds: sel }]); setName(""); setRole(""); setPhone(""); setEmail(""); setSel([]); };
  const remove = (id) => setMembers((p) => p.filter((m) => m.id !== id));
  const setPh = (id, v) => setMembers((p) => p.map((m) => (m.id === id ? { ...m, phone: v } : m)));
  const setEm = (id, v) => setMembers((p) => p.map((m) => (m.id === id ? { ...m, email: v } : m)));
  const setMS = (mid, sid) => setMembers((p) => p.map((m) => (m.id === mid ? { ...m, sevaIds: m.sevaIds.includes(sid) ? m.sevaIds.filter((x) => x !== sid) : [...m.sevaIds, sid] } : m)));
  return (
    <Modal onClose={onClose} title="Team & seva assignments" wide>
      <div className="sb-add-member">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Devotee name" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp (91…)" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <button className="sb-btn primary" onClick={add}><Plus size={15} /> Add</button>
      </div>
      <div className="sb-seva-picker">{sevas.map((s) => <button key={s.id} className={`sb-tag ${sel.includes(s.id) ? "on" : ""}`} style={{ "--c": s.color }} onClick={() => toggle(s.id)}>{s.name}</button>)}</div>
      <div className="sb-member-list">
        {members.map((m) => (
          <div key={m.id} className="sb-member">
            <div className="sb-member-id">
              <span className="sb-av" style={{ background: colorFor(m.id) }}>{initials(m.name)}</span>
              <div><strong>{m.name}</strong><em>{m.role}</em></div>
              <input className="sb-phone" value={m.phone || ""} onChange={(e) => setPh(m.id, e.target.value)} placeholder="WhatsApp no." />
              <input className="sb-phone" value={m.email || ""} onChange={(e) => setEm(m.id, e.target.value)} placeholder="Email" type="email" />
              <button className="sb-icon-btn" onClick={() => remove(m.id)}><Trash2 size={14} /></button>
            </div>
            <div className="sb-member-sevas">{sevas.map((s) => <button key={s.id} className={`sb-tag sm ${m.sevaIds.includes(s.id) ? "on" : ""}`} style={{ "--c": s.color }} onClick={() => setMS(m.id, s.id)}>{s.name}</button>)}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ================= seva admin ================= */
function SevaAdminModal({ sevas, setSevas, tasks, onClose }) {
  const [name, setName] = useState(""); const [color, setColor] = useState("#E08A1E"); const [icon, setIcon] = useState("Flame");
  const add = () => { if (!name.trim()) return; setSevas((p) => [...p, { id: uid(), name: name.trim(), icon, color }]); setName(""); };
  const remove = (id) => { if (tasks.some((t) => t.sevaId === id)) { alert("This seva still has tasks. Reassign them first."); return; } setSevas((p) => p.filter((s) => s.id !== id)); };
  const upd = (id, patch) => setSevas((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  return (
    <Modal onClose={onClose} title="Manage sevas">
      <div className="sb-add-member">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New seva name" />
        <select value={icon} onChange={(e) => setIcon(e.target.value)} className="sb-icon-sel">{ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</select>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="sb-color" />
        <button className="sb-btn primary" onClick={add}><Plus size={15} /></button>
      </div>
      <div className="sb-seva-admin">
        {sevas.map((s) => (
          <div key={s.id} className="sb-seva-row">
            <span className="sb-dot" style={{ background: s.color }}>{ICONS[s.icon] && React.createElement(ICONS[s.icon], { size: 13 })}</span>
            <input value={s.name} onChange={(e) => upd(s.id, { name: e.target.value })} />
            <select value={s.icon} onChange={(e) => upd(s.id, { icon: e.target.value })} className="sb-icon-sel">{ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</select>
            <input type="color" value={s.color} onChange={(e) => upd(s.id, { color: e.target.value })} className="sb-color" />
            <button className="sb-icon-btn" onClick={() => remove(s.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ================= festival modal ================= */
function FestivalModal({ festivals, setFestivals, tasks, onClose }) {
  const [name, setName] = useState(""); const [color, setColor] = useState("#7A5AA8"); const [date, setDate] = useState("");
  const add = () => { if (!name.trim()) return; setFestivals((p) => [...p, { id: uid(), name: name.trim(), color, date }]); setName(""); setDate(""); };
  const remove = (id) => { if (tasks.some((t) => t.festivalId === id)) { alert("Tasks are linked to this festival. Unlink them first."); return; } setFestivals((p) => p.filter((f) => f.id !== id)); };
  const upd = (id, patch) => setFestivals((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  return (
    <Modal onClose={onClose} title="Festivals & campaigns">
      <div className="sb-add-member">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Festival name" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="sb-color" />
        <button className="sb-btn primary" onClick={add}><Plus size={15} /></button>
      </div>
      <div className="sb-seva-admin">
        {festivals.map((f) => (
          <div key={f.id} className="sb-seva-row">
            <span className="sb-dot" style={{ background: f.color }}><PartyPopper size={13} /></span>
            <input value={f.name} onChange={(e) => upd(f.id, { name: e.target.value })} />
            <input type="date" value={f.date || ""} onChange={(e) => upd(f.id, { date: e.target.value })} className="sb-date-sm" />
            <input type="color" value={f.color} onChange={(e) => upd(f.id, { color: e.target.value })} className="sb-color" />
            <button className="sb-icon-btn" onClick={() => remove(f.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ================= logins management ================= */
function LoginsModal({ members, isSuperAdmin, onClose, toast }) {
  const [users, setUsers] = useState(null);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [name, setName] = useState(""); const [memberId, setMemberId] = useState(""); const [role, setRole] = useState("member");
  const [resetFor, setResetFor] = useState(null); const [resetPw, setResetPw] = useState("");

  const load = async () => {
    try { const res = await authCall("/api/auth/users", "GET"); if (res.ok) setUsers((await res.json()).users || []); }
    catch (e) { setUsers([]); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!email.trim() || password.length < 8) { toast("Email + password (8+ chars) needed"); return; }
    const res = await authCall("/api/auth/users", "POST", { email: email.trim(), password, name: name.trim(), memberId: memberId || null, role: isSuperAdmin ? role : "member" });
    const data = await res.json();
    if (res.ok) { toast("Login added"); setEmail(""); setPassword(""); setName(""); setMemberId(""); setRole("member"); load(); }
    else toast(data.error === "already_exists" ? "That email already has a login" : "Couldn't add login");
  };
  const doReset = async (targetEmail) => {
    if (resetPw.length < 8) { toast("Password needs 8+ characters"); return; }
    const res = await authCall("/api/auth/users", "PUT", { email: targetEmail, password: resetPw });
    if (res.ok) { toast("Password updated"); setResetFor(null); setResetPw(""); }
    else toast("Couldn't update password");
  };
  const toggleRole = async (u) => {
    if (!isSuperAdmin || u.role === "super_admin") return; // guarded, but never trust the client alone
    const nextRole = u.role === "admin" ? "member" : "admin";
    const res = await authCall("/api/auth/users", "PUT", { email: u.email, role: nextRole });
    if (res.ok) { toast(`${u.name || u.email} is now ${nextRole}`); load(); }
    else toast("Couldn't change role");
  };
  const remove = async (targetEmail) => {
    const res = await authCall("/api/auth/users", "DELETE", { email: targetEmail });
    if (res.ok) { toast("Login removed"); load(); }
    else toast(res.status === 403 ? "Only the super admin can remove that account" : "Couldn't remove login");
  };

  return (
    <Modal onClose={onClose} title="Logins" wide>
      <p className="sb-hint" style={{ marginBottom: 12 }}><strong>Super Admin</strong> manages everything, including who else is an admin. <strong>Admins</strong> manage sevas, team, festivals, logins, and the email account. <strong>Members</strong> can only view the board and update status, checklists, and comments on tasks. Optionally link a login to a devotee so it drives their "I am…" identity automatically.</p>
      <div className="sb-add-member">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ chars)" />
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="sb-select" style={{ flex: 1 }}>
          <option value="">Link to devotee (optional)</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {isSuperAdmin && (
          <select value={role} onChange={(e) => setRole(e.target.value)} className="sb-select">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        )}
        <button className="sb-btn primary" onClick={add}><Plus size={15} /> Add</button>
      </div>
      {users === null ? <p className="sb-hint">Loading…</p> : !users.length ? <p className="sb-hint">No other logins yet.</p> : (
        <div className="sb-member-list">
          {users.map((u) => (
            <div key={u.email} className="sb-member">
              <div className="sb-member-id">
                <span className="sb-av" style={{ background: colorFor(u.email) }}>{initials(u.name || u.email)}</span>
                <div><strong>{u.name || u.email}</strong><em>{u.email}{u.memberId ? ` · linked to ${members.find((m) => m.id === u.memberId)?.name || "a devotee"}` : ""}</em></div>
                {isSuperAdmin && u.role !== "super_admin" ? (
                  <button className={`sb-role-badge ${u.role === "admin" ? "admin" : ""}`} onClick={() => toggleRole(u)} title="Click to toggle role">{roleLabel(u.role)}</button>
                ) : (
                  <span className={`sb-role-badge ${u.role === "super_admin" ? "super" : u.role === "admin" ? "admin" : ""}`}>{roleLabel(u.role)}</span>
                )}
                <button className="sb-icon-btn" onClick={() => remove(u.email)} title="Remove login"><Trash2 size={14} /></button>
              </div>
              {resetFor === u.email ? (
                <div className="sb-add-member" style={{ marginBottom: 0 }}>
                  <input type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} placeholder="New password (8+ chars)" />
                  <button className="sb-btn primary sm" onClick={() => doReset(u.email)}>Save</button>
                  <button className="sb-btn ghost sm" onClick={() => { setResetFor(null); setResetPw(""); }}>Cancel</button>
                </div>
              ) : (
                <button className="sb-btn ghost sm" onClick={() => { setResetFor(u.email); setResetPw(""); }}>Reset password</button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ================= my profile ================= */
const roleLabel = (role) => role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "Member";

function ProfileModal({ session, members, isAdmin, onClose, onUpdated, onLogout, toast }) {
  const [name, setName] = useState(session?.name || "");
  const [memberId, setMemberId] = useState(session?.memberId || "");
  const [saving, setSaving] = useState(false);

  const [curPw, setCurPw] = useState(""); const [newPw, setNewPw] = useState(""); const [newPw2, setNewPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await authCall("/api/auth/me", "PUT", { name: name.trim(), memberId: memberId || null });
      const data = await res.json();
      if (res.ok) { toast("Profile updated"); onUpdated({ name: data.name, memberId: data.memberId }); }
      else toast("Couldn't update profile");
    } catch (e) { toast("Couldn't update profile"); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (newPw.length < 8) { toast("New password needs 8+ characters"); return; }
    if (newPw !== newPw2) { toast("New passwords don't match"); return; }
    setPwSaving(true);
    try {
      const res = await authCall("/api/auth/change-password", "PUT", { currentPassword: curPw, newPassword: newPw });
      const data = await res.json();
      if (res.ok) { toast("Password changed"); setCurPw(""); setNewPw(""); setNewPw2(""); }
      else toast(data.error === "invalid_current_password" ? "Current password is wrong" : "Couldn't change password");
    } catch (e) { toast("Couldn't change password"); }
    setPwSaving(false);
  };

  if (!session) return null;
  return (
    <Modal onClose={onClose} title="My profile">
      <div className="sb-profile-head">
        <span className="sb-av lg" style={{ background: colorFor(session.email) }}>{initials(name || session.email)}</span>
        <div><strong>{session.email}</strong><span className={`sb-role-badge ${session.role === "super_admin" ? "super" : session.role === "admin" ? "admin" : ""}`}>{roleLabel(session.role)}</span></div>
      </div>

      <label className="sb-field"><span>Display name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
      <label className="sb-field">
        <span>I am (devotee identity)</span>
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">Not linked</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      <p className="sb-hint" style={{ marginBottom: 14 }}>Linking to a devotee attributes your comments and filters "Mine" to their tasks automatically.</p>
      <button className="sb-btn primary" onClick={saveProfile} disabled={saving}><Check size={15} /> {saving ? "Saving…" : "Save profile"}</button>

      <div className="sb-section">
        <div className="sb-section-head"><span><Settings size={14} /> Change password</span></div>
        <label className="sb-field"><span>Current password</span><input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} /></label>
        <div className="sb-row2">
          <label className="sb-field"><span>New password</span><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="8+ characters" /></label>
          <label className="sb-field"><span>Confirm new password</span><input type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} /></label>
        </div>
        <button className="sb-btn primary" onClick={changePassword} disabled={pwSaving || !curPw || !newPw}><Check size={15} /> {pwSaving ? "Saving…" : "Change password"}</button>
      </div>

      <div className="sb-section">
        <button className="sb-btn danger" style={{ width: "100%", justifyContent: "center" }} onClick={onLogout}><LogOut size={15} /> Sign out</button>
      </div>
    </Modal>
  );
}

/* ================= email account (Outlook connect) ================= */
function EmailAccountModal({ status, onDisconnect, onRefresh, onClose }) {
  useEffect(() => { onRefresh(); }, []); // pick up latest status each time it's opened
  return (
    <Modal onClose={onClose} title="Email account">
      {status.connected ? (
        <div className="sb-msaccount connected">
          <div className="sb-msaccount-row">
            <span className="sb-av" style={{ background: colorFor(status.email || "x") }}>{initials(status.name || status.email || "?")}</span>
            <div>
              <strong>{status.name || status.email}</strong>
              {status.name && <em>{status.email}</em>}
            </div>
          </div>
          <p className="sb-hint">Assignment emails are sent through this Outlook account. Disconnecting stops automatic sending until a new account is connected (or the app falls back to another configured provider).</p>
          <button className="sb-btn danger" onClick={onDisconnect}><X size={14} /> Disconnect</button>
        </div>
      ) : (
        <div className="sb-msaccount">
          <p className="sb-hint">No Outlook account connected yet. Connect one so seva assignment emails are sent through it automatically.</p>
          <a className="sb-btn primary" href="/api/auth/microsoft" style={{ textDecoration: "none" }}><Mail size={15} /> Connect Outlook</a>
          <p className="sb-hint" style={{ marginTop: 10 }}>This opens Microsoft's own sign-in page — the board never sees your password.</p>
        </div>
      )}
    </Modal>
  );
}

/* ================= generic modal ================= */
function Modal({ children, title, onClose, wide }) {
  useEffect(() => { const h = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div className="sb-overlay" onClick={onClose}>
      <div className={`sb-modal ${wide ? "wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <header className="sb-modal-head"><h3>{title}</h3><button className="sb-icon-btn" onClick={onClose}><X size={18} /></button></header>
        <div className="sb-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ================= login gate ================= */
const ERROR_MESSAGES = {
  invalid_credentials: "Wrong email or password.",
  setup_password_required: "That setup passphrase isn't right.",
  password_too_short: "Password needs to be at least 8 characters.",
  bad_body: "Please fill in every field.",
  network_error: "Couldn't reach the server at all — check your internet connection, or the site may be down.",
  login_failed: "Something went wrong — try again.",
  http_404: "The login page isn't found on the server (404) — the latest deployment may not have finished yet. Wait a minute and try again.",
  db_error: "Couldn't reach the database — check MONGODB_URI in Railway's Variables tab, and that the Mongo service is running.",
  http_500: "The server hit an internal error (500) — usually a missing or wrong environment variable (check MONGODB_URI in Railway). Check your Railway deployment logs.",
  http_502: "The server didn't respond in time (502) — it may still be starting up or redeploying. Wait a minute and try again.",
  http_503: "The server is temporarily unavailable (503) — it may still be starting up or redeploying. Wait a minute and try again.",
};
function describeError(code) {
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (code && code.startsWith("http_")) return `Unexpected server response (${code.replace("http_", "")}). Check your Railway deployment logs.`;
  return "Something went wrong — try again.";
}

function LoginGate({ onLogin, needsSetup, theme }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [error, setError] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setError(""); setDetail("");
    if (!email.trim() || !password) { setError("Please fill in every field."); return; }
    setBusy(true);
    const result = await onLogin({ email: email.trim(), password, name: name.trim(), setupPassword: setupPassword.trim() });
    setBusy(false);
    if (!result.ok) { setError(describeError(result.error)); if (result.detail) setDetail(result.detail); }
  };

  return (
    <div className={`sb-root ${theme === "dark" ? "dark" : ""}`}>
      <Styles />
      <div className="sb-gate">
        <div className="sb-gate-card">
          <div className="sb-mark" style={{ margin: "0 auto" }}><Sparkles size={20} /></div>
          <h2>Seva Board</h2>
          <p>{needsSetup ? "No account exists yet — create the first one to get started." : "Sign in to continue."}</p>

          {needsSetup && (
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="Your name" autoFocus />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="Email" autoFocus={!needsSetup} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder={needsSetup ? "Choose a password (8+ characters)" : "Password"} />
          {needsSetup && (
            <input type="password" value={setupPassword} onChange={(e) => setSetupPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="Setup passphrase (if one was given to you)" />
          )}
          {error && <p className="sb-gate-error">{error}</p>}
          {detail && <p className="sb-gate-detail">Technical detail (copy this to share): <code>{detail}</code></p>}
          <button className="sb-btn primary" onClick={go} disabled={busy}>{busy ? "…" : needsSetup ? "Create account" : "Sign in"}</button>
        </div>
      </div>
    </div>
  );
}

/* ================= styles ================= */
function Styles() {
  return (<style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
.sb-root{
  --parchment:#F7F1E3;--surface:#FFFDF7;--ink:#20233F;--muted:#6E664F;
  --saffron:#E08A1E;--gold:#C79A3E;--tulsi:#4E7A52;--kumkum:#A83232;
  --line:#E7DCC0;--line-soft:#F0E8D3;--shadow:rgba(32,35,63,.35);
  --display:'Fraunces',Georgia,serif;--ui:'Hanken Grotesk',system-ui,sans-serif;
  font-family:var(--ui);color:var(--ink);background:var(--parchment);min-height:100vh;-webkit-font-smoothing:antialiased;
}
.sb-root.dark{
  --parchment:#161930;--surface:#1F2340;--ink:#ECE5D3;--muted:#9E967D;
  --line:#2E3358;--line-soft:#242949;--shadow:rgba(0,0,0,.5);
}
.sb-root *{box-sizing:border-box;}
.sb-root button{font-family:var(--ui);cursor:pointer;}
.sb-root input,.sb-root select,.sb-root textarea{font-family:var(--ui);}
kbd{background:var(--line-soft);border:1px solid var(--line);border-radius:4px;padding:0 5px;font-family:var(--ui);font-size:11px;}

.sb-head{background:linear-gradient(180deg,#25284A,#1B1D38);color:#F7F1E3;position:relative;}
.sb-toran{display:flex;justify-content:center;height:14px;overflow:hidden;}
.sb-toran span{width:100%;max-width:34px;height:16px;background:var(--saffron);border-radius:0 0 50% 50%;opacity:.9;margin-top:-2px;animation:drop .5s ease both;}
.sb-toran span:nth-child(even){background:var(--gold);height:12px;}
@keyframes drop{from{transform:translateY(-16px);opacity:0}to{transform:translateY(0);opacity:.9}}
.sb-head-in{max-width:1280px;margin:0 auto;padding:16px 22px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.sb-brand{display:flex;align-items:center;gap:13px;}
.sb-mark{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 30% 30%,var(--saffron),var(--gold));color:#25284A;box-shadow:0 0 0 3px rgba(199,154,62,.25);}
.sb-brand h1{font-family:var(--display);font-weight:600;font-size:26px;margin:0;}
.sb-brand p{margin:2px 0 0;font-size:12.5px;opacity:.72;}
.sb-head-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.sb-profile-btn{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:4px 12px 4px 4px;color:#F7F1E3;}
.sb-profile-btn:hover{background:rgba(255,255,255,.14);}
.sb-profile-label{display:flex;flex-direction:column;align-items:flex-start;line-height:1.2;max-width:130px;}
.sb-profile-label{font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;}
.sb-profile-label em{font-style:normal;font-size:10px;font-weight:700;opacity:.65;text-transform:uppercase;letter-spacing:.4px;}
.sb-role-badge{border:1px solid var(--line);background:var(--line-soft);color:var(--muted);border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;margin-left:auto;flex-shrink:0;}
.sb-profile-head{display:flex;align-items:center;gap:13px;margin-bottom:18px;padding-bottom:16px;border-bottom:1px solid var(--line-soft);}
.sb-profile-head strong{display:block;font-size:15px;color:var(--ink);}
.sb-profile-head .sb-role-badge{margin-left:0;margin-top:4px;display:inline-block;}
.sb-role-badge.admin{background:color-mix(in srgb,var(--saffron) 18%,transparent);color:var(--saffron);border-color:var(--saffron);}
.sb-role-badge.super{background:color-mix(in srgb,var(--kumkum) 16%,transparent);color:var(--kumkum);border-color:var(--kumkum);}
.sb-me{background:rgba(255,255,255,.08);color:#F7F1E3;border:1px solid rgba(255,255,255,.18);border-radius:9px;padding:8px 11px;font-size:13px;font-weight:600;outline:none;}
.sb-me option{color:#20233F;}

.sb-btn{display:inline-flex;align-items:center;gap:6px;border-radius:9px;padding:8px 13px;font-size:13.5px;font-weight:600;border:1px solid transparent;transition:.15s;}
.sb-btn.sm{padding:6px 10px;font-size:12.5px;}
.sb-btn.icon{padding:8px;}
.sb-btn.primary{background:var(--saffron);color:#25284A;border-color:var(--gold);}
.sb-btn.primary:hover{background:#ed9a2e;}
.sb-btn.primary:disabled{opacity:.5;cursor:not-allowed;}
.sb-btn.ghost{background:rgba(255,255,255,.07);color:#F7F1E3;border-color:rgba(255,255,255,.16);}
.sb-btn.ghost:hover{background:rgba(255,255,255,.14);}
.sb-btn.danger{background:rgba(168,50,50,.12);color:var(--kumkum);border-color:rgba(168,50,50,.3);}
.sb-btn.danger:hover{background:rgba(168,50,50,.2);}
.sb-icon-btn{background:transparent;border:none;color:var(--muted);padding:5px;border-radius:6px;display:grid;place-items:center;}
.sb-icon-btn:hover{background:var(--line-soft);color:var(--kumkum);}
.sb-spin{animation:spin 1s linear infinite;}@keyframes spin{to{transform:rotate(360deg)}}

.sb-dd{position:relative;}
.sb-dd-menu{position:absolute;right:0;top:calc(100% + 6px);background:var(--surface);border:1px solid var(--line);border-radius:11px;box-shadow:0 12px 30px -10px var(--shadow);padding:6px;min-width:170px;z-index:30;display:flex;flex-direction:column;gap:2px;}
.sb-dd-menu button,.sb-file{display:flex;align-items:center;gap:9px;width:100%;background:transparent;border:none;color:var(--ink);padding:9px 11px;border-radius:8px;font-size:13.5px;font-weight:600;text-align:left;cursor:pointer;}
.sb-dd-menu button:hover,.sb-file:hover{background:var(--line-soft);}
.sb-file input{display:none;}

.sb-stats{max-width:1280px;margin:18px auto 0;padding:0 22px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
.sb-stat{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:10px;color:var(--tone);}
.sb-stat.alert{border-color:rgba(168,50,50,.35);}
.sb-stat-val{font-family:var(--display);font-size:26px;font-weight:600;line-height:1;color:var(--ink);}
.sb-stat-lbl{font-size:12.5px;color:var(--muted);font-weight:600;margin-left:auto;text-align:right;}

.sb-toolbar{max-width:1280px;margin:16px auto 0;padding:0 22px;display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
.sb-search{display:flex;align-items:center;gap:7px;background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:0 11px;color:var(--muted);flex:1;min-width:170px;}
.sb-search input{border:none;outline:none;background:transparent;padding:9px 0;font-size:14px;color:var(--ink);width:100%;}
.sb-select{background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:13px;color:var(--ink);outline:none;max-width:150px;}
.sb-chip-btn{display:inline-flex;align-items:center;gap:5px;background:var(--surface);border:1px solid var(--line);color:var(--muted);border-radius:9px;padding:9px 12px;font-size:13px;font-weight:600;}
.sb-chip-btn.on{background:var(--saffron);color:#25284A;border-color:var(--gold);}
.sb-chip-btn:disabled{opacity:.5;cursor:not-allowed;}
.sb-views{display:flex;background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:3px;gap:2px;}
.sb-viewbtn{display:inline-flex;align-items:center;gap:6px;border:none;background:transparent;color:var(--muted);padding:6px 11px;border-radius:7px;font-size:13px;font-weight:600;}
.sb-viewbtn.on{background:var(--ink);color:var(--parchment);}

.sb-main{max-width:1280px;margin:0 auto;padding:20px 22px 40px;}
.sb-columns{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.sb-col{background:color-mix(in srgb,var(--surface) 55%,transparent);border:1px solid var(--line);border-radius:14px;padding:12px;min-height:220px;transition:.15s;}
.sb-col.dragover{border-color:var(--saffron);background:color-mix(in srgb,var(--saffron) 8%,transparent);}
.sb-col-head{display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:var(--tone);text-transform:uppercase;letter-spacing:.6px;padding:4px 4px 12px;}
.sb-count{margin-left:auto;background:var(--line-soft);color:var(--muted);border-radius:20px;padding:1px 9px;font-size:12px;letter-spacing:0;}
.sb-col-body{display:flex;flex-direction:column;gap:11px;min-height:40px;}

.sb-groups{display:flex;flex-direction:column;gap:24px;}
.sb-group-head{display:flex;align-items:center;gap:9px;font-family:var(--display);font-size:18px;font-weight:600;padding-bottom:10px;margin-bottom:14px;border-bottom:2px solid var(--line);color:var(--ink);}
.sb-group-head svg{color:var(--c,var(--saffron));}
.sb-group-head.person .sb-count{background:var(--saffron);color:#25284A;}
.sb-role{font-size:12px;font-weight:600;color:var(--muted);background:var(--line-soft);padding:2px 9px;border-radius:20px;}
.sb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;}

.sb-card{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--seva);border-radius:11px;padding:12px 13px;transition:.15s;animation:rise .28s ease both;}
.sb-card[draggable=true]{cursor:grab;}
.sb-card:hover{box-shadow:0 6px 18px -10px var(--shadow);transform:translateY(-1px);}
.sb-card.done{opacity:.6;}.sb-card.done h4{text-decoration:line-through;}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.sb-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px;}
.sb-chips{display:flex;flex-wrap:wrap;gap:4px;}
.sb-chip{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:700;color:var(--c);background:color-mix(in srgb,var(--c) 13%,transparent);padding:3px 8px;border-radius:20px;}
.sb-chip.rep{padding:3px 6px;}
.sb-card-tools{display:flex;gap:2px;opacity:0;transition:.15s;}
.sb-card:hover .sb-card-tools{opacity:1;}
.sb-card-tools button{background:transparent;border:none;color:var(--muted);padding:4px;border-radius:6px;display:grid;place-items:center;}
.sb-card-tools button:hover{background:var(--line-soft);color:var(--ink);}
.sb-card h4{margin:0 0 4px;font-size:14.5px;font-weight:600;line-height:1.3;cursor:pointer;}
.sb-card-notes{margin:0 0 9px;font-size:12.5px;color:var(--muted);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.sb-subbar{display:flex;align-items:center;gap:6px;margin-bottom:8px;color:var(--muted);font-size:11px;}
.sb-progress{flex:1;height:5px;background:var(--line-soft);border-radius:20px;overflow:hidden;}
.sb-progress span{display:block;height:100%;background:var(--tulsi);border-radius:20px;transition:width .3s;}
.sb-cmtcount{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--muted);margin-bottom:8px;}
.sb-card-bot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px;}
.sb-avstack{display:flex;align-items:center;}
.sb-avstack .sb-av{margin-right:-7px;border:2px solid var(--surface);}
.sb-av{width:24px;height:24px;border-radius:50%;color:#fff;font-size:10px;font-weight:700;display:grid;place-items:center;flex-shrink:0;}
.sb-av.more{background:var(--muted);}
.sb-av.lg{width:30px;height:30px;font-size:12px;}
.muted-av{background:var(--line)!important;color:var(--muted);}
.sb-av-name{font-size:12px;font-weight:600;}
.sb-av-name.muted{color:var(--muted);font-weight:500;}
.sb-card-meta{display:flex;align-items:center;gap:7px;flex-shrink:0;}
.sb-pr{font-size:10.5px;font-weight:700;border:1px solid;padding:1px 7px;border-radius:20px;}
.sb-due{display:inline-flex;align-items:center;gap:3px;font-size:11.5px;color:var(--muted);font-weight:600;}
.sb-due.over{color:var(--kumkum);}
.sb-status{width:100%;border:1px solid var(--line);border-radius:8px;padding:6px 8px;font-size:12.5px;font-weight:600;color:var(--ink);background:var(--parchment);outline:none;}
.sb-empty{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13px;padding:14px 8px;font-style:italic;}

.sb-cal{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px;}
.sb-cal-head{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
.sb-cal-head h3{font-family:var(--display);font-size:20px;margin:0;flex:0;white-space:nowrap;}
.sb-cal-head .sb-btn{margin-left:auto;}
.sb-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;}
.sb-cal-dow{text-align:center;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;padding-bottom:4px;}
.sb-cal-cell{min-height:92px;border:1px solid var(--line-soft);border-radius:9px;padding:5px;background:var(--parchment);}
.sb-cal-cell.empty{background:transparent;border:none;}
.sb-cal-cell.today{border-color:var(--saffron);box-shadow:inset 0 0 0 1px var(--saffron);}
.sb-cal-num{font-size:12px;font-weight:700;color:var(--muted);}
.sb-cal-cell.today .sb-cal-num{color:var(--saffron);}
.sb-cal-tasks{display:flex;flex-direction:column;gap:3px;margin-top:4px;}
.sb-cal-task{text-align:left;border:none;border-left:3px solid var(--c);background:color-mix(in srgb,var(--c) 12%,transparent);color:var(--ink);font-size:10.5px;font-weight:600;padding:2px 5px;border-radius:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sb-cal-task.done{opacity:.5;text-decoration:line-through;}
.sb-cal-task.over{border-left-color:var(--kumkum);}
.sb-cal-more{font-size:10px;color:var(--muted);padding-left:3px;}

.sb-analytics{display:flex;flex-direction:column;gap:18px;}
.sb-a-top{display:grid;grid-template-columns:280px 1fr;gap:16px;}
.sb-a-donut{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px;}
.sb-donut-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;}
.sb-donut-center strong{display:block;font-family:var(--display);font-size:30px;color:var(--ink);}
.sb-donut-center span{font-size:12px;color:var(--muted);}
.sb-a-mini{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.sb-mini{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:12px;padding:16px;display:flex;flex-direction:column;justify-content:center;}
.sb-mini strong{font-family:var(--display);font-size:30px;color:var(--ink);line-height:1;}
.sb-mini span{font-size:12.5px;color:var(--muted);margin-top:4px;font-weight:600;}
.sb-a-charts{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.sb-a-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px;}
.sb-a-card h4{margin:0 0 12px;font-family:var(--display);font-size:16px;font-weight:600;}

.sb-overlay{position:fixed;inset:0;background:rgba(27,29,56,.55);backdrop-filter:blur(2px);display:grid;place-items:center;padding:20px;z-index:50;animation:fade .18s ease;}
@keyframes fade{from{opacity:0}to{opacity:1}}
.sb-modal{background:var(--surface);border-radius:16px;width:100%;max-width:460px;max-height:90vh;overflow:auto;box-shadow:0 24px 60px -20px rgba(0,0,0,.5);border:1px solid var(--line);animation:pop .2s ease;}
.sb-modal.wide{max-width:620px;}
@keyframes pop{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
.sb-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line-soft);position:sticky;top:0;background:var(--surface);z-index:2;}
.sb-modal-head h3{margin:0;font-family:var(--display);font-size:19px;font-weight:600;}
.sb-modal-body{padding:18px;}
.sb-field{display:block;margin-bottom:14px;}
.sb-field>span{display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:var(--muted);margin-bottom:5px;}
.sb-field input,.sb-field select,.sb-field textarea{width:100%;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:14px;color:var(--ink);background:var(--parchment);outline:none;resize:vertical;}
.sb-field input:focus,.sb-field select:focus,.sb-field textarea:focus{border-color:var(--saffron);box-shadow:0 0 0 3px rgba(224,138,30,.15);}
.sb-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.sb-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
.sb-assign-pick{display:flex;flex-wrap:wrap;gap:6px;}
.sb-tag{border:1px solid var(--line);background:var(--parchment);color:var(--muted);border-radius:20px;padding:5px 11px;font-size:12px;font-weight:600;}
.sb-tag.sm{padding:3px 9px;font-size:11px;}
.sb-tag.on{background:color-mix(in srgb,var(--c) 16%,transparent);color:var(--c);border-color:var(--c);}
.sb-tag-div{font-size:11px;color:var(--muted);align-self:center;padding:0 3px;}
.sb-section{border-top:1px solid var(--line-soft);padding-top:14px;margin-top:4px;margin-bottom:14px;}
.sb-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.sb-section-head>span{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--ink);}
.sb-mini-add{display:inline-flex;align-items:center;gap:4px;background:var(--line-soft);border:none;color:var(--ink);border-radius:7px;padding:5px 10px;font-size:12px;font-weight:600;}
.sb-sub-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
.sb-check{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--line);background:var(--parchment);display:grid;place-items:center;color:#fff;flex-shrink:0;}
.sb-check.on{background:var(--tulsi);border-color:var(--tulsi);}
.sb-sub-row input{flex:1;border:1px solid var(--line);border-radius:8px;padding:7px 10px;font-size:13.5px;background:var(--parchment);color:var(--ink);outline:none;}
.sb-sub-row input.done{text-decoration:line-through;color:var(--muted);}
.sb-hint{font-size:12.5px;color:var(--muted);font-style:italic;margin:0;}
.sb-msaccount{display:flex;flex-direction:column;gap:12px;}
.sb-msaccount-row{display:flex;align-items:center;gap:11px;}
.sb-msaccount-row>div{display:flex;flex-direction:column;line-height:1.3;}
.sb-msaccount-row em{font-style:normal;font-size:12.5px;color:var(--muted);}
.sb-msaccount .sb-btn{align-self:flex-start;display:inline-flex;}
.sb-cmt{background:var(--parchment);border-radius:9px;padding:9px 11px;margin-bottom:8px;}
.sb-cmt strong{font-size:12.5px;}.sb-cmt em{font-size:11px;color:var(--muted);font-style:normal;margin-left:6px;}
.sb-cmt p{margin:4px 0 0;font-size:13px;line-height:1.4;}
.sb-cmt-add{display:flex;gap:8px;}
.sb-cmt-add input{flex:1;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:13.5px;background:var(--parchment);color:var(--ink);outline:none;}
.sb-notify{display:flex;align-items:center;flex-wrap:wrap;gap:8px;background:color-mix(in srgb,var(--tulsi) 10%,transparent);border:1px solid color-mix(in srgb,var(--tulsi) 30%,transparent);border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:13px;font-weight:600;}
.sb-notify.email{background:color-mix(in srgb,var(--saffron) 10%,transparent);border-color:color-mix(in srgb,var(--saffron) 30%,transparent);}
.sb-wa{display:inline-flex;align-items:center;gap:5px;background:#25D366;color:#fff;border:none;border-radius:8px;padding:6px 11px;font-size:12.5px;font-weight:700;}
.sb-mailbtn{display:inline-flex;align-items:center;gap:5px;background:var(--saffron);color:#25284A;border:none;border-radius:8px;padding:6px 11px;font-size:12.5px;font-weight:700;}
.sb-timeline{display:flex;flex-direction:column;gap:0;position:relative;padding-left:4px;}
.sb-tl-row{display:flex;gap:11px;position:relative;padding-bottom:14px;}
.sb-tl-row:last-child{padding-bottom:0;}
.sb-tl-row::before{content:"";position:absolute;left:10px;top:22px;bottom:0;width:1.5px;background:var(--line);}
.sb-tl-row:last-child::before{display:none;}
.sb-tl-dot{width:21px;height:21px;border-radius:50%;background:var(--line-soft);color:var(--muted);display:grid;place-items:center;flex-shrink:0;z-index:1;}
.sb-tl-row.status .sb-tl-dot{background:color-mix(in srgb,#D4A017 20%,transparent);color:#D4A017;}
.sb-tl-row.assigned .sb-tl-dot,.sb-tl-row.unassigned .sb-tl-dot{background:color-mix(in srgb,#3B4A8F 18%,transparent);color:#3B4A8F;}
.sb-tl-row.created .sb-tl-dot{background:color-mix(in srgb,var(--saffron) 20%,transparent);color:var(--saffron);}
.sb-tl-row.priority .sb-tl-dot{background:color-mix(in srgb,var(--kumkum) 16%,transparent);color:var(--kumkum);}
.sb-tl-row.email .sb-tl-dot{background:color-mix(in srgb,var(--tulsi) 18%,transparent);color:var(--tulsi);}
.sb-tl-body p{margin:0;font-size:13px;line-height:1.4;color:var(--ink);}
.sb-tl-body em{font-style:normal;font-size:11.5px;color:var(--muted);}
.sb-modal-foot{display:flex;align-items:center;gap:9px;margin-top:6px;}
.sb-spacer{flex:1;}

.sb-add-member{display:flex;gap:9px;margin-bottom:14px;flex-wrap:wrap;}
.sb-add-member input:not([type=color]):not([type=date]),.sb-add-member{}
.sb-add-member input{flex:1;min-width:110px;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:14px;background:var(--parchment);outline:none;color:var(--ink);}
.sb-color{width:44px;min-width:44px;padding:3px;height:38px;border:1px solid var(--line);border-radius:9px;background:var(--parchment);cursor:pointer;flex:0!important;}
.sb-icon-sel{max-width:110px;flex:0!important;border:1px solid var(--line);border-radius:9px;padding:9px;background:var(--parchment);color:var(--ink);}
.sb-seva-picker{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;}
.sb-member-list{display:flex;flex-direction:column;gap:14px;}
.sb-member{border:1px solid var(--line);border-radius:12px;padding:12px;}
.sb-member-id{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.sb-member-id>div{display:flex;flex-direction:column;line-height:1.25;}
.sb-member-id em{font-style:normal;font-size:12px;color:var(--muted);}
.sb-phone{width:130px;border:1px solid var(--line);border-radius:8px;padding:6px 9px;font-size:12.5px;background:var(--parchment);color:var(--ink);outline:none;}
.sb-member-id .sb-icon-btn{margin-left:auto;}
.sb-member-sevas{display:flex;flex-wrap:wrap;gap:5px;}
.sb-seva-admin{display:flex;flex-direction:column;gap:8px;}
.sb-seva-row{display:flex;align-items:center;gap:9px;}
.sb-seva-row>input:not([type=color]):not([type=date]){flex:1;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:14px;background:var(--parchment);outline:none;color:var(--ink);}
.sb-date-sm{width:140px;flex:0!important;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--parchment);color:var(--ink);}
.sb-dot{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;color:#fff;flex-shrink:0;}

.sb-toasts{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;z-index:60;align-items:center;}
.sb-toast{display:flex;align-items:center;gap:7px;background:var(--ink);color:var(--parchment);border-radius:10px;padding:10px 16px;font-size:13.5px;font-weight:600;box-shadow:0 10px 30px -8px rgba(0,0,0,.5);animation:rise .25s ease;}
.sb-gate{min-height:100vh;display:grid;place-items:center;padding:20px;}
.sb-gate-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:34px 28px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 50px -20px var(--shadow);}
.sb-gate-card h2{font-family:var(--display);font-size:24px;margin:16px 0 6px;}
.sb-gate-card p{color:var(--muted);font-size:14px;margin:0 0 18px;}
.sb-gate-card input{width:100%;border:1px solid var(--line);border-radius:10px;padding:11px 13px;font-size:15px;background:var(--parchment);color:var(--ink);outline:none;margin-bottom:12px;}
.sb-gate-card input:focus{border-color:var(--saffron);box-shadow:0 0 0 3px rgba(224,138,30,.15);}
.sb-gate-card .sb-btn{width:100%;justify-content:center;}
.sb-gate-error{color:var(--kumkum);font-size:12.5px;margin:-4px 0 4px;text-align:left;}
.sb-gate-detail{font-size:11px;color:var(--muted);text-align:left;margin:0 0 8px;word-break:break-word;}
.sb-gate-detail code{background:var(--line-soft);padding:1px 5px;border-radius:4px;font-family:monospace;}
.sb-foot{text-align:center;color:var(--muted);font-size:12px;padding:20px;border-top:1px solid var(--line-soft);font-family:var(--display);font-style:italic;}

@media(max-width:900px){.sb-a-top{grid-template-columns:1fr;}.sb-a-charts{grid-template-columns:1fr;}}
@media(max-width:820px){.sb-columns{grid-template-columns:1fr;}.sb-stats{grid-template-columns:repeat(2,1fr);}.sb-row3{grid-template-columns:1fr;}.sb-viewlbl{display:none;}.sb-cal-cell{min-height:70px;}}
@media(prefers-reduced-motion:reduce){.sb-root *{animation:none!important;transition:none!important;}}
`}</style>);
}
