import type { ComponentType } from "react";
import type { Booking, Stadium, Team, Ticket, User } from "@/types";

// ─── Data shape returned by useProfileData ────────────────────────────────────
export interface ProfileData {
  // Auth-derived — available synchronously from Firebase user object
  emailVerified: boolean;
  lastSignInTime: string | null;

  // PLAYER
  confirmedBookingsCount: number;
  teamsCount: number;
  eventsCount: number;
  isCaptain: boolean;
  lastBooking: Booking | null;
  lastTeam: Team | null;

  // OWNER
  stadiums: Stadium[];
  ownerBookingsTotal: number;

  // ADMIN
  usersCount: number;
  openTicketsCount: number;
  flaggedPostsCount: number;
  pendingStadiums: Stadium[];
  highPriorityTickets: Ticket[];

  // Async state
  loading: boolean;
  error: string | null;
}

export const EMPTY_PROFILE_DATA: ProfileData = {
  emailVerified: false,
  lastSignInTime: null,
  confirmedBookingsCount: 0,
  teamsCount: 0,
  eventsCount: 0,
  isCaptain: false,
  lastBooking: null,
  lastTeam: null,
  stadiums: [],
  ownerBookingsTotal: 0,
  usersCount: 0,
  openTicketsCount: 0,
  flaggedPostsCount: 0,
  pendingStadiums: [],
  highPriorityTickets: [],
  loading: true,
  error: null,
};

// ─── Props every module component receives ────────────────────────────────────
export interface ProfileModuleProps {
  appUser: User;
  data: ProfileData;
}

// ─── Registry entry: component + layout hint ─────────────────────────────────
export interface ModuleSlot {
  key: string;
  Component: ComponentType<ProfileModuleProps>;
  /** "full" = md:col-span-2  |  "half" = md:col-span-1 */
  colSpan: "full" | "half";
}
