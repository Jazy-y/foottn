"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logPageVisit } from "@/services/db";

export function TrafficTracker() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (!initialized.current) {
      initialized.current = true;
      
      const sessionId = sessionStorage.getItem("footy_session_id");
      if (!sessionId) {
        // Only log unique sessions for a more accurate visitor count
        sessionStorage.setItem("footy_session_id", Math.random().toString(36).substring(2));
        logPageVisit();
      }
    }
  }, [pathname]);

  return null;
}
