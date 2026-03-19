"use client";

import { useRef, useState, useCallback } from "react";
import {
  float32ToInt16,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  pcmToAudioBuffer,
} from "@/lib/audio-utils";

const GEMINI_INPUT_SAMPLE_RATE = 16000;
const GEMINI_OUTPUT_SAMPLE_RATE = 24000;

interface FormAnswer {
  questionTitle: string;
  answer: string;
}

interface UseGeminiLiveOptions {
  apiKey: string;
  model?: string;
  onTranscript?: (role: "user" | "agent", text: string) => void;
  onError?: (error: string) => void;
  onLog?: (message: string) => void;
  onFormSubmit?: (answers: FormAnswer[]) => void;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "active"
  | "ended"
  | "error";

export function useGeminiLive({
  apiKey,
  model = "gemini-2.5-flash-native-audio-latest",
  onTranscript,
  onError,
  onFormSubmit,
}: UseGeminiLiveOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const pendingSubmitTextRef = useRef("");
  const toolCallReceivedRef = useRef(false);

  const playNextChunk = useCallback(() => {
    const ctx = playbackCtxRef.current;
    if (!ctx || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const buffer = audioQueueRef.current.shift()!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      playNextChunk();
    };
  }, []);

  const connect = useCallback(
    async (systemPrompt: string, tools?: unknown[]) => {
      try {
        setStatus("connecting");

        const audioCtx = new AudioContext({ sampleRate: GEMINI_INPUT_SAMPLE_RATE });
        audioCtxRef.current = audioCtx;
        if (audioCtx.state === "suspended") await audioCtx.resume();

        const playbackCtx = new AudioContext({ sampleRate: GEMINI_OUTPUT_SAMPLE_RATE });
        playbackCtxRef.current = playbackCtx;
        nextPlayTimeRef.current = 0;
        if (playbackCtx.state === "suspended") await playbackCtx.resume();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: GEMINI_INPUT_SAMPLE_RATE,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        streamRef.current = stream;

        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          const setupConfig: Record<string, unknown> = {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: ["AUDIO"],
            },
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
          };
          if (tools && tools.length > 0) {
            setupConfig.tools = tools;
          }
          ws.send(JSON.stringify({ setup: setupConfig }));
        };

        ws.onmessage = async (event) => {
          const raw = event.data instanceof Blob ? await event.data.text() : event.data;
          const data = JSON.parse(raw);

          if (data.error) {
            onError?.(data.error.message || JSON.stringify(data.error));
            return;
          }

          if (data.setupComplete) {
            setStatus("active");
            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;

            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            processor.onaudioprocess = (e) => {
              if (ws.readyState !== WebSocket.OPEN) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = float32ToInt16(inputData);
              const base64 = arrayBufferToBase64(int16.buffer as ArrayBuffer);
              ws.send(JSON.stringify({
                realtimeInput: { mediaChunks: [{ data: base64, mimeType: "audio/pcm;rate=16000" }] },
              }));
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);

            ws.send(
              JSON.stringify({
                clientContent: {
                  turns: [
                    {
                      role: "user",
                      parts: [{ text: "Please start the conversation. Begin with your greeting." }],
                    },
                  ],
                  turnComplete: true,
                },
              })
            );
          }

          if (data.serverContent) {
            const parts = data.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  const arrayBuf = base64ToArrayBuffer(part.inlineData.data);
                  const int16 = new Int16Array(arrayBuf);
                  const audioBuffer = pcmToAudioBuffer(
                    playbackCtxRef.current!,
                    int16,
                    GEMINI_OUTPUT_SAMPLE_RATE
                  );
                  audioQueueRef.current.push(audioBuffer);

                  if (!isPlayingRef.current) {
                    playNextChunk();
                  }
                }

                if (part.text) {
                  onTranscript?.("agent", part.text);
                  pendingSubmitTextRef.current += " " + part.text;
                }
              }
            }

            if (data.serverContent?.inputTranscript) onTranscript?.("user", data.serverContent.inputTranscript);
            if (data.serverContent?.outputTranscript) onTranscript?.("agent", data.serverContent.outputTranscript);

            if (data.serverContent?.turnComplete) {
              const text = pendingSubmitTextRef.current.toLowerCase();
              const mentionsSubmit = text.includes("submit_form") || text.includes("submitting") || text.includes("submit the form") || text.includes("initiating form submission");

              if (mentionsSubmit && !toolCallReceivedRef.current) {
                ws.send(JSON.stringify({
                  clientContent: {
                    turns: [{ role: "user", parts: [{ text: "Please call the submit_form function now with the answers you collected. Do not respond with text — just call the function." }] }],
                    turnComplete: true,
                  },
                }));
              }
              pendingSubmitTextRef.current = "";
            }
          }

          if (data.toolCall) {
            toolCallReceivedRef.current = true;
            const functionCalls = data.toolCall.functionCalls;
            if (functionCalls) {
              for (const fc of functionCalls) {
                if (fc.name === "submit_form" && fc.args?.answers) {
                  // Gemini sometimes returns answers as stringified JSON — parse them
                  const answers = fc.args.answers.map((a: unknown) => {
                    if (typeof a === "string") {
                      try { return JSON.parse(a); } catch { return a; }
                    }
                    return a;
                  });
                  onFormSubmit?.(answers as FormAnswer[]);

                  ws.send(JSON.stringify({
                    toolResponse: {
                      functionResponses: [{
                        id: fc.id,
                        name: fc.name,
                        response: { success: true, message: "Form submitted successfully" },
                      }],
                    },
                  }));
                }
              }
            }
          }
        };

        ws.onerror = () => {
          setStatus("error");
          onError?.("WebSocket connection error");
        };

        ws.onclose = () => {
          setStatus((prev) => (prev === "error" ? "error" : "ended"));
        };
      } catch (err) {
        setStatus("error");
        onError?.((err as Error).message || "Failed to connect");
      }
    },
    [apiKey, model, onTranscript, onError, onFormSubmit, playNextChunk]
  );

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (playbackCtxRef.current) {
      playbackCtxRef.current.close();
      playbackCtxRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    setStatus("ended");
  }, []);

  return { status, isSpeaking, connect, disconnect };
}
