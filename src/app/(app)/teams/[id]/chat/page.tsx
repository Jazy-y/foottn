"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText } from "@/components/ui/gradient-text";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LiveDot } from "@/components/ui/live-dot";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTeamById,
  sendTeamMessage,
  subscribeToTeamMessages,
} from "@/services/db";
import type { Team, TeamMessage } from "@/types";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";

function toDate(t: unknown): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

export default function TeamChatPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, appUser } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    getTeamById(id).then(setTeam);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    return subscribeToTeamMessages(id, setMessages);
  }, [id]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || sending) return;
    setSending(true);
    try {
      await sendTeamMessage({
        teamId: id,
        userId: user.uid,
        userName: appUser?.displayName ?? user.email ?? "anon",
        userPhoto: user.photoURL ?? "",
        text: text.trim(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/teams/${id}`}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              / discussion d'équipe
            </div>
            <h1 className="font-mono text-xl font-medium">
              <GradientText className="font-medium">
                {team?.name ?? "chargement..."}
              </GradientText>
            </h1>
          </div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-300 inline-flex items-center gap-1.5">
          <LiveDot variant="online" />
          en direct
        </div>
      </div>

      <GlassCard className="flex-1 flex flex-col p-0 overflow-hidden">
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="h-full grid place-items-center font-mono text-xs text-muted-foreground">
              aucun message pour l'instant — soyez le premier à écrire.
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.userId === user?.uid;
              const date = toDate(m.createdAt);
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-card font-mono text-[10px]">
                      {m.userName?.charAt(0)?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${mine ? "items-end" : ""}`}>
                    <div
                      className={`flex items-baseline gap-2 mb-1 ${
                        mine ? "justify-end" : ""
                      }`}
                    >
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {mine ? "vous" : m.userName}
                      </span>
                      {date && (
                        <span className="font-mono text-[9px] text-muted-foreground/60">
                          {format(date, "HH:mm")}
                        </span>
                      )}
                    </div>
                    <div
                      className={`rounded-xl px-3 py-2 font-mono text-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/[0.04] border border-white/[0.06]"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form
          onSubmit={send}
          className="flex items-center gap-2 p-3 border-t border-white/[0.06]"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="taper un message..."
            className="flex-1 h-10 bg-white/[0.03] border-white/[0.08] font-mono"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="rounded-lg bg-primary text-primary-foreground p-2.5 hover:opacity-90 disabled:opacity-40 transition-opacity"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
