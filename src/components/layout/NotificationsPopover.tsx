"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, Calendar, Trophy, Users, CreditCard, MessageCircle, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToUserNotifications,
  markNotificationRead,
} from "@/services/db";
import type { AppNotification, NotificationType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";

const typeIcon: Record<NotificationType, React.ElementType> = {
  BOOKING: Calendar,
  EVENT: Trophy,
  TEAM: Users,
  PAYMENT: CreditCard,
  MESSAGE: MessageCircle,
  SYSTEM: Sparkles,
};

// ── Avatar with a small type-icon badge ────────────────────────────────────────
function NotificationAvatar({ n }: { n: AppNotification }) {
  const Icon = typeIcon[n.type] ?? Sparkles;

  // Real photo from the actor (liker / commenter)
  if (n.actorPhoto) {
    return (
      <div className="relative shrink-0">
        <img
          src={n.actorPhoto}
          alt={n.actorName ?? ""}
          className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
        />
        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background border border-white/10 grid place-items-center">
          <Icon className="h-2.5 w-2.5 text-primary" />
        </span>
      </div>
    );
  }

  // Initials fallback when we know the name but have no photo
  if (n.actorName) {
    const initials = n.actorName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return (
      <div className="relative shrink-0">
        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center font-mono text-[11px] font-bold text-primary ring-1 ring-white/10">
          {initials}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background border border-white/10 grid place-items-center">
          <Icon className="h-2.5 w-2.5 text-primary" />
        </span>
      </div>
    );
  }

  // Generic icon for system / non-actor notifications
  return (
    <div className="hairline shrink-0 grid h-9 w-9 place-items-center rounded-xl bg-card">
      <Icon className="h-3.5 w-3.5 text-primary" />
    </div>
  );
}

function getDate(t: AppNotification["createdAt"] | undefined): Date | null {
  if (!t) return null;
  if (t instanceof Date) return t;
  if (t instanceof Timestamp) return t.toDate();
  return null;
}

export function NotificationsPopover() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const knownIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  useEffect(() => {
    if (!user) return;
    return subscribeToUserNotifications(user.uid, (newItems) => {
      setItems(newItems);
      
      if (initialLoad.current) {
        newItems.forEach(n => { if (n.id) knownIds.current.add(n.id); });
        initialLoad.current = false;
        return;
      }
      
      newItems.forEach(n => {
        if (n.id && !knownIds.current.has(n.id)) {
          knownIds.current.add(n.id);
          if (!n.read) {
            toast(n.title, {
              description: n.body,
              icon: <Bell className="h-4 w-4" />
            });
          }
        }
      });
    });
  }, [user]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            className="relative rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,255,180,0.6)]" />
            )}
          </button>
        }
      />
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-card/90 backdrop-blur-xl border-white/[0.06]"
      >
        <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            boîte de réception · {unread} nouveau(x)
          </span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
          {items.length === 0 ? (
            <div className="p-6 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
              aucune notification
            </div>
          ) : (
            items.map((n) => {
              const date = getDate(n.createdAt);
              return (
                <Link
                  key={n.id}
                  href={n.href ?? "#"}
                  onClick={() => n.id && markNotificationRead(n.id)}
                  className={`flex gap-3 p-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${
                    !n.read ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  <NotificationAvatar n={n} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs font-medium truncate">
                      {n.title}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground line-clamp-2">
                      {n.body}
                    </div>
                    {date && (
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatDistanceToNow(date, { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  {!n.read && (
                    <span className="self-start mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
