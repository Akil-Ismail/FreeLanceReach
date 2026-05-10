"use client";

import { useMemo, useState } from "react";
import { fastApi } from "@/lib/api";
import SectionShell from "@/components/protected/SectionShell";

type ChatItem = { role: "user" | "assistant"; content: string };

export default function HomeChatbotPage() {
  const role = (
    typeof window !== "undefined"
      ? localStorage.getItem("userRole")
      : "freelancer"
  ) as "freelancer" | "company" | null;

  const endpoint = useMemo(
    () => (role === "company" ? "/company-chat/chat" : "/freelancer-chat/chat"),
    [role],
  );

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!message.trim()) return;
    const msg = message.trim();
    setMessage("");
    const updated = [...chat, { role: "user" as const, content: msg }];
    setChat(updated);
    setLoading(true);

    try {
      const response = await fastApi.post(endpoint, {
        message: msg,
        chat_history: updated,
      });
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: response.data.response || "No response" },
      ]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: "Assistant unavailable right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionShell
      title="Chatbot"
      description="Use AI assistant for profile/proposal guidance and communication drafting."
    >
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="h-[420px] overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
          {chat.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${item.role === "assistant" ? "bg-white border border-gray-200 text-gray-700" : "bg-red-600 text-white ml-8"}`}
            >
              {item.content}
            </div>
          ))}
          {chat.length === 0 && (
            <p className="text-sm text-gray-500">
              Start a conversation with the assistant.
            </p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="input"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button className="btn" onClick={send} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </SectionShell>
  );
}
