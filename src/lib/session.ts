"use client";

const SESSION_KEY = "ai_chat_session_id";

/** Returns the browser-local session ID, creating one if it doesn't exist. */
export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}
