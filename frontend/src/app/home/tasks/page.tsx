"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, ListChecks } from "lucide-react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import Modal from "@/components/protected/Modal";

type Task = {
  id: number;
  contract_id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date?: string | null;
};

type Contract = {
  id: number;
  status: string;
  proposal_match_id: number;
  freelancer?: { first_name?: string; last_name?: string; email?: string };
  company?: { company_name?: string; contact_first_name?: string };
};

const COLUMNS: { key: Task["status"]; label: string; dot: string }[] = [
  { key: "todo", label: "To Do", dot: "bg-gray-400" },
  { key: "in_progress", label: "In Progress", dot: "bg-amber-400" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
];

const PRIORITY_STYLE: Record<Task["priority"], string> = {
  low: "bg-gray-100 text-gray-500",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  status: "todo" as Task["status"],
  priority: "medium" as Task["priority"],
  due_date: "",
};

export default function HomeTasksPage() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userId") || 0)
      : 0;

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(
    null,
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadContracts = useCallback(async () => {
    if (!userId) return;
    const res = await api.get("/contracts", {
      params: { actor_user_id: userId },
    });
    const active = (res.data || []).filter((c: Contract) =>
      ["active", "company_signed", "freelancer_signed"].includes(c.status),
    );
    setContracts(active);
    if (active.length === 1) setSelectedContractId(active[0].id);
  }, [userId]);

  const loadTasks = useCallback(
    async (contractId: number) => {
      setLoadingTasks(true);
      try {
        const res = await api.get("/tasks", {
          params: { actor_user_id: userId, contract_id: contractId },
        });
        setTasks(res.data || []);
      } finally {
        setLoadingTasks(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);
  useEffect(() => {
    if (selectedContractId) loadTasks(selectedContractId);
    else setTasks([]);
  }, [selectedContractId, loadTasks]);

  const createTask = async () => {
    if (!selectedContractId || !form.title.trim()) {
      showToast("error", "Task title is required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/tasks", {
        actor_user_id: userId,
        contract_id: selectedContractId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || undefined,
      });
      setForm(EMPTY_FORM);
      setModalOpen(false);
      showToast("success", "Task added.");
      await loadTasks(selectedContractId);
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message || e.message || "Task creation failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (task: Task, newStatus: Task["status"]) => {
    setUpdatingId(task.id);
    try {
      await api.put(`/tasks/${task.id}`, {
        actor_user_id: userId,
        status: newStatus,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
      );
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message || e.message || "Status update failed.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const contractLabel = (c: Contract) => {
    if (role === "company") {
      const f = c.freelancer;
      const name = f
        ? `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email
        : "Freelancer";
      return `Contract #${c.id} — ${name}`;
    }
    return `Contract #${c.id} (${c.status})`;
  };

  const nextStatus: Record<Task["status"], Task["status"] | null> = {
    todo: "in_progress",
    in_progress: "done",
    done: null,
  };

  const nextLabel: Record<Task["status"], string | null> = {
    todo: "Start",
    in_progress: "Mark Done",
    done: null,
  };

  return (
    <>
      <SectionShell
        title="Tasks"
        description="Kanban board for managing deliverables linked to active contracts."
      >
        {toast && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
          >
            {toast.text}
          </div>
        )}

        {/* Contract selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Active Contract
          </h2>
          {contracts.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              No active contracts. A contract must be signed before tasks can be
              created.
            </p>
          ) : (
            <select
              className="input max-w-sm"
              value={selectedContractId ?? ""}
              onChange={(e) =>
                setSelectedContractId(Number(e.target.value) || null)
              }
            >
              <option value="">Select a contract</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {contractLabel(c)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Kanban board */}
        {selectedContractId && (
          <>
            {loadingTasks ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
                Loading tasks...
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {COLUMNS.map((col) => {
                  const colTasks = tasks.filter((t) => t.status === col.key);
                  return (
                    <div
                      key={col.key}
                      className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <h3 className="text-sm font-semibold text-gray-800 flex-1">
                          {col.label}
                        </h3>
                        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {colTasks.length}
                        </span>
                      </div>

                      {colTasks.length === 0 ? (
                        <p className="text-xs text-gray-300 text-center py-6">
                          Empty
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {colTasks.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-gray-200 transition"
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${PRIORITY_STYLE[task.priority]}`}
                                >
                                  {task.priority}
                                </span>
                                {task.due_date && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(
                                      task.due_date,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {nextStatus[task.status] && (
                                <button
                                  className="mt-2 w-full text-xs btn-secondary py-1.5"
                                  disabled={updatingId === task.id}
                                  onClick={() =>
                                    updateStatus(task, nextStatus[task.status]!)
                                  }
                                >
                                  {updatingId === task.id
                                    ? "..."
                                    : nextLabel[task.status]}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!selectedContractId && contracts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <ListChecks className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Select a contract above to view its Kanban board.
            </p>
          </div>
        )}
      </SectionShell>

      {/* Floating + button (only when contract selected) */}
      {selectedContractId && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="Add task"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setForm(EMPTY_FORM);
        }}
        title="Add Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Task Title *
            </label>
            <input
              className="input"
              placeholder="e.g. Design landing page hero section"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <input
              className="input"
              placeholder="Optional details..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Initial Status
              </label>
              <select
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Task["status"] })
                }
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Priority
              </label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value as Task["priority"],
                  })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Due Date
            </label>
            <input
              className="input"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              className="btn flex-1 text-sm"
              onClick={createTask}
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Task"}
            </button>
            <button
              className="btn-secondary flex-1 text-sm"
              onClick={() => {
                setModalOpen(false);
                setForm(EMPTY_FORM);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
