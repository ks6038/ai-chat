"use client";

import { useEffect, useState } from "react";
import { getSessionId } from "@/lib/session";

export function useSessionId(): string {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  return sessionId;
}
