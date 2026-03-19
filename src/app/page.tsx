"use client";

import { useEffect, useState } from "react";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { createFormAgentPrompt, getFormTools } from "@/lib/prompts";
import type { FormData } from "@/lib/types";

type AppState = "input" | "connecting" | "conversation" | "ended";
type TranscriptEntry = { role: "user" | "agent"; text: string; timestamp: Date };

const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-gray-900";
const btnPrimary = "w-full py-3 px-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition flex items-center justify-center gap-2";

const submissionStyles: Record<string, string> = {
  submitting: "bg-yellow-50 text-yellow-800 border border-yellow-200",
  success: "bg-green-50 text-green-800 border border-green-200",
  failed: "bg-red-50 text-red-800 border border-red-200",
};
const submissionMessages: Record<string, string> = {
  submitting: "Cauli is submitting your form...",
  success: "Form submitted successfully!",
  failed: "Submission failed. Try again.",
};

async function processSubmitStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onComplete: () => void,
  onError: () => void
) {
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const e = JSON.parse(line.slice(6));
        if (e.type === "COMPLETE" || e.status === "COMPLETED") onComplete();
        if (e.type === "ERROR" || e.error) onError();
      } catch {}
    }
  }
}

export default function HomePage() {
  const [formUrl, setFormUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [appState, setAppState] = useState<AppState>("input");
  const [error, setError] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success" | "failed">("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    fetch("/api/gemini-token").then((r) => r.json()).then((d) => d.key && setApiKey(d.key)).catch(() => {});
  }, []);

  async function handleFormSubmit(answers: { questionTitle: string; answer: string }[]) {
    setSubmissionStatus("submitting");
    try {
      const res = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formUrl, responses: answers }),
      });
      if (!res.ok || !res.body) {
        setSubmissionStatus("failed");
        return;
      }
      const reader = res.body.getReader();
      await processSubmitStream(
        reader,
        () => {
          setSubmissionStatus("success");
          if (phoneNumber) {
            fetch("/api/user-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phoneNumber,
                answers,
                formUrl,
                formTitle: formData?.title || "Unknown Form",
                status: "submitted",
              }),
            }).catch(() => {});
          }
        },
        () => setSubmissionStatus("failed")
      );
    } catch {
      setSubmissionStatus("failed");
    }
  }

  const { status, isSpeaking, connect, disconnect } = useGeminiLive({
    apiKey,
    onTranscript: (role, text) => setTranscript((p) => [...p, { role, text, timestamp: new Date() }]),
    onError: setError,
    onLog: () => {},
    onFormSubmit: handleFormSubmit,
  });

  useEffect(() => {
    if (status === "active") setAppState("conversation");
    if (status === "ended" || status === "error") setAppState("ended");
  }, [status]);

  async function handleStart() {
    if (!formUrl) {
      setError("Please enter a Google Form URL");
      return;
    }

    setError("");
    setTranscript([]);
    setSubmissionStatus("idle");
    setAppState("connecting");

    try {
      const res = await fetch("/api/parse-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse form");

      setFormData(data.data);

      let profileResponses: Record<string, string> = {};
      if (phoneNumber) {
        try {
          const r = await fetch(`/api/user-profile?phone=${encodeURIComponent(phoneNumber)}`);
          const j = await r.json();
          profileResponses = j.profile?.commonResponses ?? {};
        } catch {}
      }

      const prompt = createFormAgentPrompt(data.data.title, data.data.questions, profileResponses);
      await connect(prompt, getFormTools());
    } catch (err: any) {
      setError(err.message);
      setAppState("input");
    }
  }

  function handleEnd() {
    disconnect();
    setAppState("ended");
  }

  function handleReset() {
    setAppState("input");
    setFormData(null);
    setTranscript([]);
    setError("");
    setSubmissionStatus("idle");
  }

  const showConversation = appState === "conversation" || appState === "ended";
  const statusText = status === "active" ? (isSpeaking ? "Cauli speaking..." : "Listening...") : status === "ended" ? "Conversation ended" : status === "error" ? "Error" : "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cauli</h1>
          <p className="text-gray-500 text-center mt-1 text-sm">Your friendly forms AI — fill out Google Forms with your voice</p>
        </div>

        {appState === "input" && (
          <div className="space-y-4">
            <input type="url" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="Paste a Google Form URL..." className={inputClass} />
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone number (optional — enables memory)" className={inputClass} />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button onClick={handleStart} disabled={!formUrl || !apiKey} className={btnPrimary}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              Start Voice Conversation
            </button>
          </div>
        )}

        {appState === "connecting" && (
          <div className="text-center py-8">
            <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Getting Cauli ready...</p>
          </div>
        )}

        {showConversation && (
          <div className="space-y-4">
            {formData && (
              <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-medium text-amber-900">{formData.title}</p>
                <p className="text-xs text-amber-700">{formData.questions.length} questions</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status === "active" ? "bg-green-500" : status === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-gray-400"}`} />
              <span className="text-sm text-gray-600">{statusText}</span>
              <div className="ml-auto flex gap-2">
                {appState === "conversation" && (
                  <button onClick={handleEnd} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition">
                    End
                  </button>
                )}
                {appState === "ended" && (
                  <button onClick={handleReset} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">
                    New Form
                  </button>
                )}
              </div>
            </div>

            {status === "active" && (
              <div className="flex items-center justify-center gap-1 h-10">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${isSpeaking ? "bg-amber-500" : "bg-gray-300"}`}
                    style={{ height: isSpeaking ? `${Math.random() * 28 + 6}px` : "4px" }}
                  />
                ))}
              </div>
            )}

            {submissionStatus !== "idle" && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium ${submissionStyles[submissionStatus]}`}>
                {submissionMessages[submissionStatus]}
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Transcript</p>
              <div className="h-40 overflow-y-auto space-y-1 text-sm">
                {transcript.length === 0 ? (
                  <p className="text-gray-400 text-xs">Waiting for conversation...</p>
                ) : (
                  transcript.map((entry, i) => (
                    <div key={i} className={entry.role === "agent" ? "text-amber-700" : "text-blue-700"}>
                      <span className="text-gray-400 text-xs">{entry.timestamp.toLocaleTimeString()} </span>
                      <span className="font-medium">{entry.role === "agent" ? "Cauli" : "You"}: </span>
                      {entry.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-gray-400 text-xs mt-8 space-y-1">
          <p>Powered by Gemini Live API</p>
        </div>
      </div>
    </div>
  );
}
