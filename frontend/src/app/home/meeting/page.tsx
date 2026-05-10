"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, CalendarDays, Video } from "lucide-react";
import api from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";
import Modal from "@/components/protected/Modal";

type Meeting = {
  id: number;
  proposal_match_id: number;
  company_user_id: number;
  freelancer_user_id: number;
  status: string;
  proposed_at: string | null;
  freelancer_proposed_at: string | null;
  notes: string | null;
  google_meet_link: string | null;
  company?: { company_name?: string; contact_first_name?: string };
  freelancer?: { first_name?: string; last_name?: string; email?: string };
};

type Match = {
  id: number;
  proposal_id: number;
  freelancer_user_id: number;
  status: string;
  freelancer?: { first_name?: string; last_name?: string; email?: string };
  proposal?: { title?: string };
};

const STATUS_STYLE: Record<string, string> = {
  pending_freelancer: "bg-amber-50 text-amber-700",
  pending_company: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

const EMPTY_FORM = {
  proposal_match_id: "",
  freelancer_user_id: "",
  proposed_at: "",
  notes: "",
};

export default function HomeMeetingPage() {
  const role =
    typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const userId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("userId") || 0)
      : 0;

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [mutualMatches, setMutualMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const loadMeetings = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get("/meetings", {
        params: { actor_user_id: userId },
      });
      setMeetings(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadMutualMatches = useCallback(async () => {
    if (!userId || role !== "company") return;
    const res = await api.get("/matches", {
      params: { actor_user_id: userId },
    });
    setMutualMatches(
      (res.data || []).filter((m: Match) => m.status === "mutual_approved"),
    );
  }, [userId, role]);

  useEffect(() => {
    loadMeetings();
    loadMutualMatches();
  }, [loadMeetings, loadMutualMatches]);

  const createRequest = async () => {
    if (!form.proposal_match_id || !form.proposed_at) {
      showToast("error", "Please select a match and a proposed time.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/meetings", {
        actor_user_id: userId,
        proposal_match_id: Number(form.proposal_match_id),
        company_user_id: userId,
        freelancer_user_id: Number(form.freelancer_user_id),
        proposed_at: form.proposed_at,
        notes: form.notes || undefined,
      });
      setForm(EMPTY_FORM);
      setModalOpen(false);
      showToast("success", "Meeting request sent to the freelancer.");
      await loadMeetings();
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message ||
          e.message ||
          "Could not create meeting request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const respond = async (meetingId: number, action: "approve" | "reject") => {
    setRespondingId(meetingId);
    try {
      await api.post(`/meetings/${meetingId}/respond`, {
        actor_user_id: userId,
        action,
      });
      showToast(
        "success",
        `Meeting ${action === "approve" ? "approved" : "rejected"}.`,
      );
      await loadMeetings();
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showToast(
        "error",
        e.response?.data?.message || e.message || "Response failed.",
      );
    } finally {
      setRespondingId(null);
    }
  };

  const matchLabel = (m: Match) => {
    const f = m.freelancer;
    const name = f
      ? `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email
      : `#${m.freelancer_user_id}`;
    return `${m.proposal?.title || `Proposal #${m.proposal_id}`} — ${name}`;
  };

  const meetingWith = (meeting: Meeting) => {
    if (role === "company") {
      const f = meeting.freelancer;
      return f
        ? `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.email
        : `Freelancer #${meeting.freelancer_user_id}`;
    }
    return (
      meeting.company?.company_name ||
      meeting.company?.contact_first_name ||
      `Company`
    );
  };

  const canRespond = (meeting: Meeting) => {
    if (role === "freelancer" && meeting.status === "pending_freelancer")
      return true;
    if (role === "company" && meeting.status === "pending_company") return true;
    return false;
  };

  const formatDate = (dt: string | null) => {
    if (!dt) return null;
    return new Date(dt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <>
      <SectionShell
        title="Meetings"
        description={
          role === "company"
            ? "Schedule interviews with matched freelancers. Approved meetings include a Google Meet link."
            : "Review and respond to meeting requests from companies."
        }
      >
        {toast && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${toast.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
          >
            {toast.text}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Scheduled Meetings
          </h2>

          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
              Loading...
            </div>
          ) : meetings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                {role === "company"
                  ? "No meetings yet. Use the + button to schedule one after a match is approved."
                  : "No meetings yet. They will appear here when a company invites you."}
              </p>
            </div>
          ) : (
            meetings.map((meeting) => {
              const meta =
                STATUS_STYLE[meeting.status] || "bg-gray-100 text-gray-500";
              return (
                <div
                  key={meeting.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-gray-300 transition"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">
                          {meetingWith(meeting)}
                        </p>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta}`}
                        >
                          {meeting.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      {meeting.proposed_at && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Proposed: {formatDate(meeting.proposed_at)}
                        </p>
                      )}
                      {meeting.freelancer_proposed_at && (
                        <p className="text-xs text-gray-500">
                          Freelancer proposed:{" "}
                          {formatDate(meeting.freelancer_proposed_at)}
                        </p>
                      )}
                      {meeting.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Notes: {meeting.notes}
                        </p>
                      )}
                    </div>

                    {meeting.google_meet_link && (
                      <a
                        href={meeting.google_meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn text-sm shrink-0 flex items-center gap-2"
                      >
                        <Video className="w-4 h-4" /> Join Meeting
                      </a>
                    )}
                  </div>

                  {canRespond(meeting) && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100 mt-2">
                      <button
                        className="btn text-sm flex-1"
                        disabled={respondingId === meeting.id}
                        onClick={() => respond(meeting.id, "approve")}
                      >
                        {respondingId === meeting.id ? "..." : "Approve"}
                      </button>
                      <button
                        className="btn-secondary text-sm"
                        disabled={respondingId === meeting.id}
                        onClick={() => respond(meeting.id, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SectionShell>

      {/* Floating + (company only) */}
      {role === "company" && (
        <button
          onClick={() => setModalOpen(true)}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="Schedule meeting"
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
        title="Schedule a Meeting"
      >
        {mutualMatches.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            No mutually approved matches yet. Both parties must approve a match
            before scheduling.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Match *
              </label>
              <select
                className="input"
                value={form.proposal_match_id}
                onChange={(e) => {
                  const matchId = e.target.value;
                  const match = mutualMatches.find(
                    (m) => String(m.id) === matchId,
                  );
                  setForm({
                    ...form,
                    proposal_match_id: matchId,
                    freelancer_user_id: match
                      ? String(match.freelancer_user_id)
                      : "",
                  });
                }}
              >
                <option value="">Select a mutually approved match</option>
                {mutualMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {matchLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Proposed Time *
              </label>
              <input
                className="input"
                type="datetime-local"
                value={form.proposed_at}
                onChange={(e) =>
                  setForm({ ...form, proposed_at: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Notes (optional)
              </label>
              <input
                className="input"
                placeholder="e.g. 30-min intro call via Google Meet"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                className="btn flex-1 text-sm"
                onClick={createRequest}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Request"}
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
        )}
      </Modal>
    </>
  );
}
