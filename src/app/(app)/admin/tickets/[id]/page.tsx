"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

// Admin ticket detail just reuses the shared support/[id] thread page.
// Redirect immediately so the same real-time chat is shown.
export default function AdminTicketDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    router.replace(`/support/${id}`);
  }, [id, router]);

  return null;
}
