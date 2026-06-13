"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X, Pencil, Trash2, Image, Check, MoreHorizontal } from "lucide-react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";

/* ─── Types ──────────────────────────────────────────────────── */
type Task = {
  id: number;
  contract_id: number;
  title: string;
  description?: string;
  notes?: string;
  attachments?: string[];
  status: string;
  priority: "low" | "medium" | "high";
  due_date?: string | null;
  order_index?: number;
};

type Contract = {
  id: number;
  status: string;
  freelancer?: { first_name?: string; last_name?: string; email?: string };
  company?: { company_name?: string; contact_first_name?: string };
};

type Column = { id: string; title: string; color: string };

const COMPANY_COL_ID = "company_requests";

const DEFAULT_COLUMNS: Column[] = [
  { id: COMPANY_COL_ID, title: "Company's Requests", color: "bg-red-400" },
  { id: "todo",         title: "To Do",              color: "bg-gray-400" },
  { id: "in_progress",  title: "In Progress",        color: "bg-amber-400" },
  { id: "in_review",    title: "In Review",          color: "bg-blue-400" },
  { id: "done",         title: "Done",               color: "bg-emerald-500" },
];

const PRIORITY_STYLE: Record<string, string> = {
  low:    "bg-gray-100 text-gray-500",
  medium: "bg-amber-50 text-amber-700",
  high:   "bg-red-50 text-red-700",
};

function colKey(contractId: number) { return `kanban_cols:${contractId}`; }

/* ─── Task Detail Modal ───────────────────────────────────────── */
function TaskModal({
  task,
  columns,
  onClose,
  onSave,
  onDelete,
  role,
  readOnly,
}: {
  task: Task;
  columns: Column[];
  onClose: () => void;
  onSave: (updated: Partial<Task>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  role: string | null;
  readOnly?: boolean;
}) {
  const [title,       setTitle]       = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [notes,       setNotes]       = useState(task.notes || "");
  const [priority,    setPriority]    = useState(task.priority);
  const [status,      setStatus]      = useState(task.status);
  const [dueDate,     setDueDate]     = useState(task.due_date || "");
  const [attachments, setAttachments] = useState<string[]>(task.attachments || []);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ title, description, notes, priority, status, due_date: dueDate || null, attachments });
    setSaving(false);
  };

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (ev.target?.result) setAttachments(a => [...a, ev.target!.result as string]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeAttachment = (i: number) => setAttachments(a => a.filter((_, idx) => idx !== i));

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    setDeleting(true);
    await onDelete(task.id);
    setDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Colour strip based on priority */}
        <div className={`h-1.5 rounded-t-2xl ${priority === "high" ? "bg-red-500" : priority === "medium" ? "bg-amber-400" : "bg-gray-300"}`} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3">
          {readOnly ? (
            <h2 className="flex-1 text-lg font-bold text-gray-900">{title}</h2>
          ) : (
            <input
              className="flex-1 text-lg font-bold text-gray-900 outline-none border-b-2 border-transparent focus:border-red-400 bg-transparent transition"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          )}
          <div className="flex items-center gap-1 shrink-0">
            {readOnly && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mr-1">View only</span>
            )}
            {!readOnly && role !== "company" && (
              <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-5">
          {/* Meta row */}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Column</label>
              <select className="input text-sm py-1.5" value={status} onChange={e => setStatus(e.target.value)} disabled={readOnly}>
                {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Priority</label>
              <select className="input text-sm py-1.5" value={priority} onChange={e => setPriority(e.target.value as Task["priority"])} disabled={readOnly}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">Due Date</label>
              <input className="input text-sm py-1.5" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={readOnly} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
            <textarea
              className="input text-sm resize-none min-h-[60px]"
              placeholder="No description."
              value={description}
              onChange={e => setDescription(e.target.value)}
              readOnly={readOnly}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
            <textarea
              className="input text-sm resize-none min-h-[120px] leading-relaxed"
              placeholder="No notes."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              readOnly={readOnly}
            />
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500">Attachments</label>
              {!readOnly && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs flex items-center gap-1 text-red-600 hover:text-red-700 font-medium"
                  >
                    <Image className="w-3.5 h-3.5" /> Add image
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={addImage} />
                </>
              )}
            </div>
            {attachments.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((src, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-100">
                    <img src={src} alt={`attachment ${i + 1}`} className="w-full h-24 object-cover" />
                    <button
                      onClick={() => removeAttachment(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {attachments.length === 0 && (
              <p className="text-xs text-gray-300 italic">No attachments yet</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          {readOnly ? (
            <button className="btn-secondary text-sm flex-1" onClick={onClose}>Close</button>
          ) : (
            <>
              <button className="btn text-sm flex items-center gap-1.5 flex-1" onClick={handleSave} disabled={saving}>
                <Check className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
              </button>
              <button className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Column header with edit/delete ─────────────────────────── */
function ColumnHeader({
  col,
  count,
  onRename,
  onDelete,
  locked,
}: {
  col: Column;
  count: number;
  onRename: (title: string) => void;
  onDelete: () => void;
  locked?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(col.title);
  const [menu,    setMenu]    = useState(false);

  const commit = () => {
    if (val.trim()) onRename(val.trim());
    setEditing(false);
    setMenu(false);
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2.5 h-2.5 rounded-full ${col.color} shrink-0`} />
      {editing ? (
        <input
          autoFocus
          className="flex-1 text-sm font-bold text-gray-800 outline-none border-b border-red-400 bg-transparent"
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        />
      ) : (
        <h3 className="text-sm font-bold text-gray-800 flex-1">{col.title}</h3>
      )}
      <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{count}</span>
      {!locked && (
        <div className="relative">
          <button onClick={() => setMenu(m => !m)} className="p-1 rounded hover:bg-gray-100 text-gray-400 transition">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {menu && (
            <div className="absolute right-0 top-7 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-36">
              <button className="w-full text-left text-xs px-3 py-2 hover:bg-gray-50 flex items-center gap-2" onClick={() => { setEditing(true); setMenu(false); }}>
                <Pencil className="w-3.5 h-3.5" /> Rename
              </button>
              <button className="w-full text-left text-xs px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2" onClick={onDelete}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
const EMPTY_FORM = { title: "", description: "", status: "todo", priority: "medium" as Task["priority"], due_date: "" };

export default function HomeTasksPage() {
  const role   = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId = typeof window !== "undefined" ? Number(localStorage.getItem("userId") || 0) : 0;

  const [contracts,         setContracts]         = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [tasks,             setTasks]             = useState<Task[]>([]);
  const [columns,           setColumns]           = useState<Column[]>(DEFAULT_COLUMNS);
  const [loadingTasks,      setLoadingTasks]       = useState(false);
  const [modalOpen,         setModalOpen]         = useState(false);
  const [form,              setForm]              = useState(EMPTY_FORM);
  const [submitting,        setSubmitting]        = useState(false);
  const [selectedTask,      setSelectedTask]      = useState<Task | null>(null);
  const [toast,             setToast]             = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [draggingId,        setDraggingId]        = useState<number | null>(null);
  const [addingColName,     setAddingColName]     = useState("");
  const [showAddCol,        setShowAddCol]        = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Load columns from localStorage, always ensuring defaults exist ─── */
  useEffect(() => {
    if (!selectedContractId) return;
    const stored = localStorage.getItem(colKey(selectedContractId));
    let cols: Column[] = stored ? JSON.parse(stored) : [...DEFAULT_COLUMNS];
    // Inject any default columns that are missing (e.g. added after initial save)
    DEFAULT_COLUMNS.forEach(def => {
      if (!cols.find(c => c.id === def.id)) {
        if (def.id === COMPANY_COL_ID) cols = [def, ...cols]; // always first
        else cols = [...cols, def];
      }
    });
    setColumns(cols);
    // Persist the merged result so next load is correct
    localStorage.setItem(colKey(selectedContractId), JSON.stringify(cols));
  }, [selectedContractId]);

  const saveCols = (cols: Column[]) => {
    setColumns(cols);
    if (selectedContractId) localStorage.setItem(colKey(selectedContractId), JSON.stringify(cols));
  };

  /* ─── Contracts ─── */
  const loadContracts = useCallback(async () => {
    if (!userId) return;
    const res = await api.get("/contracts", { params: { actor_user_id: userId } });
    const active = (res.data || []).filter((c: Contract) => ["active", "company_signed", "freelancer_signed"].includes(c.status));
    setContracts(active);
    if (active.length === 1) setSelectedContractId(active[0].id);
  }, [userId]);

  const loadTasks = useCallback(async (contractId: number) => {
    setLoadingTasks(true);
    try {
      const res = await api.get("/tasks", { params: { actor_user_id: userId, contract_id: contractId } });
      setTasks(res.data || []);
    } finally {
      setLoadingTasks(false);
    }
  }, [userId]);

  useEffect(() => { loadContracts(); }, [loadContracts]);
  useEffect(() => { if (selectedContractId) loadTasks(selectedContractId); else setTasks([]); }, [selectedContractId, loadTasks]);

  /* ─── Create task ─── */
  const createTask = async () => {
    if (!selectedContractId || !form.title.trim()) { showToast("error", "Task title is required."); return; }
    setSubmitting(true);
    try {
      await api.post("/tasks", { actor_user_id: userId, contract_id: selectedContractId, ...form, due_date: form.due_date || undefined });
      setForm(EMPTY_FORM);
      setModalOpen(false);
      showToast("success", "Task added.");
      await loadTasks(selectedContractId);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("error", e.response?.data?.message || e.message || "Task creation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Update task ─── */
  const updateTask = async (taskId: number, data: Partial<Task>) => {
    await api.put(`/tasks/${taskId}`, { actor_user_id: userId, ...data });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));
  };

  /* ─── Delete task ─── */
  const deleteTask = async (taskId: number) => {
    await api.delete(`/tasks/${taskId}`, { params: { actor_user_id: userId } }).catch(() => {});
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedContractId) loadTasks(selectedContractId);
  };

  /* ─── Drag and drop ─── */
  const onDragStart = (taskId: number) => setDraggingId(taskId);
  const onDragOver  = (e: React.DragEvent)  => e.preventDefault();
  const onDrop      = async (colId: string) => {
    if (!draggingId) return;
    const task = tasks.find(t => t.id === draggingId);
    if (task && task.status !== colId) {
      await updateTask(draggingId, { status: colId });
    }
    setDraggingId(null);
  };

  /* ─── Column management ─── */
  const addColumn = () => {
    if (!addingColName.trim()) return;
    const id = addingColName.trim().toLowerCase().replace(/\s+/g, "_");
    const colors = ["bg-purple-400", "bg-pink-400", "bg-indigo-400", "bg-teal-400", "bg-orange-400"];
    const newCol: Column = { id, title: addingColName.trim(), color: colors[columns.length % colors.length] };
    saveCols([...columns, newCol]);
    setAddingColName("");
    setShowAddCol(false);
  };

  const renameColumn = (id: string, title: string) => saveCols(columns.map(c => c.id === id ? { ...c, title } : c));

  const deleteColumn = (id: string) => {
    if (!confirm("Delete this column? Tasks in it will move to 'To Do'.")) return;
    setTasks(prev => prev.map(t => t.status === id ? { ...t, status: "todo" } : t));
    saveCols(columns.filter(c => c.id !== id));
  };

  /* ─── Contract label ─── */
  const contractLabel = (c: Contract) => {
    if (role === "company") {
      const f = c.freelancer;
      return f ? `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email : `Contract #${c.id}`;
    }
    return c.company?.company_name?.trim() || c.company?.contact_first_name || `Contract #${c.id}`;
  };

  return (
    <>
      <SectionShell title="Tasks" description="Kanban board for deliverables linked to active contracts.">
        {toast && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {toast.text}
          </div>
        )}

        {/* Contract selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active Contract</h2>
          {contracts.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">No active contracts yet.</p>
          ) : (
            <select className="input max-w-sm" value={selectedContractId ?? ""} onChange={e => setSelectedContractId(Number(e.target.value) || null)}>
              <option value="">Select a contract</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{contractLabel(c)}</option>)}
            </select>
          )}
        </div>

        {selectedContractId && (
          <>
            {loadingTasks ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">Loading tasks…</div>
            ) : (
              <>
                {/* Kanban board — scrollbar on top via rotateX flip */}
                <div style={{ transform: "rotateX(180deg)", overflowX: "auto" }}>
                  <div style={{ transform: "rotateX(180deg)" }} className="flex gap-4 pb-2 pt-1">
                  {columns.map(col => {
                    const colTasks = tasks.filter(t => t.status === col.id);
                    const isCompanyCol = col.id === COMPANY_COL_ID;
                    // Company can only add/edit in the company column
                    const canAdd  = role !== "company" || isCompanyCol;
                    const canEdit = role !== "company" || isCompanyCol;
                    return (
                      <div
                        key={col.id}
                        className={`border rounded-2xl p-4 shadow-sm flex-shrink-0 w-72 ${isCompanyCol && role === "company" ? "border-red-200 bg-red-50/30" : "bg-white border-gray-200"}`}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(col.id)}
                      >
                        <ColumnHeader
                          col={col}
                          count={colTasks.length}
                          onRename={title => renameColumn(col.id, title)}
                          onDelete={() => deleteColumn(col.id)}
                          locked={role === "company"}
                        />

                        <div className="space-y-2 min-h-[60px]">
                          {colTasks.length === 0 && (
                            <p className="text-xs text-gray-300 text-center py-6">Empty</p>
                          )}
                          {colTasks.map(task => (
                            <div
                              key={task.id}
                              draggable={role !== "company" || isCompanyCol}
                              onDragStart={() => (role !== "company" || isCompanyCol) && onDragStart(task.id)}
                              onDragEnd={() => setDraggingId(null)}
                              onClick={() => setSelectedTask(task)}
                              className={`rounded-xl border bg-gray-50 p-3 hover:border-red-200 hover:shadow-sm transition select-none ${draggingId === task.id ? "opacity-40 rotate-1" : "border-gray-100"} ${canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-70"}`}
                            >
                              <p className="text-sm font-semibold text-gray-900 mb-1">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-gray-400 line-clamp-2 mb-1">{task.description}</p>
                              )}
                              {task.attachments && task.attachments.length > 0 && (
                                <div className="flex gap-1 mb-1.5 overflow-hidden">
                                  {task.attachments.slice(0, 3).map((src, i) => (
                                    <img key={i} src={src} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                                  ))}
                                  {task.attachments.length > 3 && (
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-500">+{task.attachments.length - 3}</div>
                                  )}
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_STYLE[task.priority]}`}>{task.priority}</span>
                                {task.due_date && (
                                  <span className="text-xs text-gray-400">{new Date(task.due_date).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add task — company only sees it on their column */}
                        {canAdd && (
                          <button
                            className="mt-3 w-full text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl py-2 border border-dashed border-gray-200 hover:border-red-200 transition flex items-center justify-center gap-1"
                            onClick={() => { setForm({ ...EMPTY_FORM, status: col.id }); setModalOpen(true); }}
                          >
                            <Plus className="w-3.5 h-3.5" /> Add task
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add column — hidden for company */}
                  {role !== "company" && (
                    <div className="flex-shrink-0 w-72">
                      {showAddCol ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                          <input
                            autoFocus
                            className="input text-sm mb-2"
                            placeholder="Column name…"
                            value={addingColName}
                            onChange={e => setAddingColName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") addColumn(); if (e.key === "Escape") setShowAddCol(false); }}
                          />
                          <div className="flex gap-2">
                            <button className="btn text-xs flex-1" onClick={addColumn}>Add</button>
                            <button className="btn-secondary text-xs" onClick={() => setShowAddCol(false)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddCol(true)}
                          className="w-full h-14 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition text-sm flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add column
                        </button>
                      )}
                    </div>
                  )}
                  </div>{/* inner rotateX */}
                </div>{/* outer rotateX */}
              </>
            )}
          </>
        )}

        {!selectedContractId && contracts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400 text-sm">
            Select a contract above to open the board.
          </div>
        )}
      </SectionShell>

      {/* Create task modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Add Task</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input className="input text-sm" placeholder="Task title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea className="input text-sm resize-none min-h-[80px]" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Column</label>
                <select className="input text-sm" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <select className="input text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Task["priority"] })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
              <input className="input text-sm" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-1">
              <button className="btn flex-1 text-sm" onClick={createTask} disabled={submitting}>{submitting ? "Adding…" : "Add Task"}</button>
              <button className="btn-secondary flex-1 text-sm" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          columns={columns}
          role={role}
          readOnly={role === "company" && selectedTask.status !== COMPANY_COL_ID}
          onClose={() => setSelectedTask(null)}
          onSave={async data => {
            await updateTask(selectedTask.id, data);
            setSelectedTask(null);
            showToast("success", "Task saved.");
          }}
          onDelete={async id => {
            await deleteTask(id);
            showToast("success", "Task deleted.");
          }}
        />
      )}

      {/* FAB — only for freelancer */}
      {selectedContractId && role !== "company" && (
        <button
          onClick={() => { setForm(EMPTY_FORM); setModalOpen(true); }}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}
    </>
  );
}
