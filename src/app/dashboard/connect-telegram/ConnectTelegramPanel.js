"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Same alphabet the bot uses for its own generateLinkCode (excludes
// visually ambiguous characters like 0/O and 1/I).
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const CODE_LIFETIME_MS = 15 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

function randomCode() {
  return Array.from({ length: CODE_LENGTH }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
}

export default function ConnectTelegramPanel({ userId, initiallyLinked }) {
  const supabase = createClient();
  const [linked, setLinked] = useState(initiallyLinked);
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef(null);
  // Re-linking generates a new code while the account is still linked to its
  // old chat, so polling must wait for the chat id to actually change rather
  // than firing the instant it re-reads the still-valid old one.
  const priorChatIdRef = useRef(null);

  const generateCode = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    const newCode = randomCode();
    const expiresAt = new Date(Date.now() + CODE_LIFETIME_MS).toISOString();

    const { error } = await supabase
      .from("users")
      .update({ telegram_link_code: newCode, telegram_link_code_expires_at: expiresAt })
      .eq("id", userId);

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setCode(newCode);
  }, [supabase, userId]);

  useEffect(() => {
    if (!initiallyLinked) generateCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (linked) return;

    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from("users").select("telegram_chat_id").eq("id", userId).single();
      const chatId = data?.telegram_chat_id ?? null;
      if (chatId && chatId !== priorChatIdRef.current) {
        setLinked(true);
        setCode(null);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [linked, supabase, userId]);

  if (linked) {
    return (
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 space-y-3">
        <p className="text-[var(--positive)] font-medium">✅ Telegram is connected.</p>
        <p className="text-sm text-[var(--text-muted)]">
          You can send tasks, expenses, and events straight from your Telegram chat with the bot.
        </p>
        <button
          onClick={async () => {
            const { data } = await supabase.from("users").select("telegram_chat_id").eq("id", userId).single();
            priorChatIdRef.current = data?.telegram_chat_id ?? null;
            setLinked(false);
            generateCode();
          }}
          disabled={loading}
          className="text-sm text-[var(--action)] hover:underline disabled:opacity-50"
        >
          Link a different Telegram account instead
        </button>
        {errorMsg && <p className="text-sm text-[var(--holiday-text)]">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        {BOT_USERNAME ? (
          <>
            Open{" "}
            <a
              href={`https://t.me/${BOT_USERNAME}`}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--action)] hover:underline"
            >
              @{BOT_USERNAME}
            </a>{" "}
            on Telegram and send it this code:
          </>
        ) : (
          "Message your Telegram bot with this code:"
        )}
      </p>

      {code ? (
        <div className="text-3xl font-mono font-semibold tracking-[0.3em] text-center py-3 bg-[var(--surface-alt)] rounded-md">
          {code}
        </div>
      ) : (
        <div className="text-sm text-[var(--text-muted)]">Generating a code…</div>
      )}

      <p className="text-xs text-[var(--text-faint)]">This code expires in 15 minutes.</p>

      <div className="flex items-center gap-3">
        <button
          onClick={generateCode}
          disabled={loading}
          className="text-sm text-[var(--action)] hover:underline disabled:opacity-50"
        >
          Generate a new code
        </button>
        <span className="text-xs text-[var(--text-faint)]">Waiting for you to connect…</span>
      </div>

      {errorMsg && <p className="text-sm text-[var(--holiday-text)]">{errorMsg}</p>}
    </div>
  );
}
