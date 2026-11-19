"use client";

import { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserBookings,
  getUserTeams,
  getUserEventsCount,
  getStadiumsByOwner,
  getOwnerBookings,
  listAllUsers,
  getPendingStadiums,
  getOpenTicketsCount,
  getFlaggedPostsCount,
  getHighPriorityOpenTickets,
} from "@/services/db";
import type { Booking, Team } from "@/types";
import {
  EMPTY_PROFILE_DATA,
  type ProfileData,
} from "@/app/(app)/profile/_components/modules/types";

// ─── Shared date coercion ─────────────────────────────────────────────────────
function toMs(t: unknown): number {
  if (!t) return 0;
  if (t instanceof Date) return t.getTime();
  if (t instanceof Timestamp) return t.toDate().getTime();
  return 0;
}

function newestFirst<T extends { createdAt: unknown }>(items: T[]): T[] {
  return [...items].sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
}

// ─── Role fetchers (each runs a Promise.all internally) ──────────────────────
async function fetchPlayer(
  userId: string,
): Promise<Partial<ProfileData>> {
  const [bookings, teams, eventsCount] = await Promise.all([
    getUserBookings(userId),
    getUserTeams(userId),
    getUserEventsCount(userId),
  ]);

  const confirmed = bookings.filter(
    (b: Booking) => b.status === "CONFIRMED" || b.status === "COMPLETED",
  );
  const sortedBookings = newestFirst(bookings);
  const sortedTeams = newestFirst(teams as (Team & { createdAt: unknown })[]);

  return {
    confirmedBookingsCount: confirmed.length,
    teamsCount: teams.length,
    eventsCount,
    isCaptain: teams.some((t) => t.captainId === userId),
    lastBooking: sortedBookings[0] ?? null,
    lastTeam: sortedTeams[0] ?? null,
  };
}

async function fetchOwner(userId: string): Promise<Partial<ProfileData>> {
  const [stadiums, ownerBookings] = await Promise.all([
    getStadiumsByOwner(userId),
    getOwnerBookings(userId),
  ]);
  return {
    stadiums,
    ownerBookingsTotal: ownerBookings.length,
  };
}

async function fetchAdmin(): Promise<Partial<ProfileData>> {
  const [users, pendingStadiums, openTicketsCount, flaggedPostsCount, highPriorityTickets] =
    await Promise.all([
      listAllUsers(),
      getPendingStadiums(),
      getOpenTicketsCount(),
      getFlaggedPostsCount(),
      getHighPriorityOpenTickets(),
    ]);
  return {
    usersCount: users.length,
    pendingStadiums,
    openTicketsCount,
    flaggedPostsCount,
    highPriorityTickets,
  };
}

// ─── Public hook ─────────────────────────────────────────────────────────────
export function useProfileData(): ProfileData {
  const { user, appUser } = useAuth();
  const [data, setData] = useState<ProfileData>(EMPTY_PROFILE_DATA);

  useEffect(() => {
    if (!user || !appUser) return;

    // Fields available immediately from Firebase Auth
    const emailVerified = user.emailVerified;
    const lastSignInTime = user.metadata?.lastSignInTime ?? null;

    const run = async () => {
      try {
        let patch: Partial<ProfileData>;
        switch (appUser.role) {
          case "PLAYER":
            patch = await fetchPlayer(user.uid);
            break;
          case "OWNER":
            patch = await fetchOwner(user.uid);
            break;
          case "SUPER_ADMIN":
            patch = await fetchAdmin();
            break;
          default:
            patch = {};
        }
        setData((prev) => ({
          ...prev,
          ...patch,
          emailVerified,
          lastSignInTime,
          error: null,
          loading: false,
        }));
      } catch {
        setData((prev) => ({
          ...prev,
          emailVerified,
          lastSignInTime,
          loading: false,
          error: "Impossible de charger les données du profil.",
        }));
      }
    };

    run();
    // Re-fetch only when the account identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, appUser?.role]);

  return data;
}
