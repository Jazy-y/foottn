/**
 * Lightweight AI / heuristic helpers.
 * Heavy AI calls (OpenAI) are wrapped on the server route handlers — these
 * pure functions stay client-safe.
 */

import type {
  EventParticipant,
  Stadium,
  User,
  Booking,
} from "@/types";
import { Timestamp } from "firebase/firestore";

const SKILL_VALUE: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  PRO: 4,
};

export interface TeamBalance {
  teams: EventParticipant[];
  scoreA: number;
  scoreB: number;
  /** true when score difference is ≤ 1 skill point — teams are considered even */
  isBalanced: boolean;
}

/**
 * Greedy team balancer for events.
 *
 * Sort order: goalkeepers first (so each team gets at most one),
 * then by skill descending. Snake-draft into A / B so total skill
 * stays as close as possible.
 */
export function autoBalanceTeams(participants: EventParticipant[]): TeamBalance {
  if (participants.length === 0) {
    return { teams: [], scoreA: 0, scoreB: 0, isBalanced: true };
  }

  const sorted = [...participants].sort((a, b) => {
    // GKs are drafted first so one lands per team
    const gkA = a.position === "GK" ? 1 : 0;
    const gkB = b.position === "GK" ? 1 : 0;
    if (gkB !== gkA) return gkB - gkA;
    // Then sort by skill descending
    return (
      (SKILL_VALUE[b.skillLevel ?? "INTERMEDIATE"] ?? 2) -
      (SKILL_VALUE[a.skillLevel ?? "INTERMEDIATE"] ?? 2)
    );
  });

  const teamA: EventParticipant[] = [];
  const teamB: EventParticipant[] = [];
  let sumA = 0;
  let sumB = 0;

  for (const p of sorted) {
    const v = SKILL_VALUE[p.skillLevel ?? "INTERMEDIATE"] ?? 2;
    if (sumA <= sumB) {
      teamA.push({ ...p, team: "A" });
      sumA += v;
    } else {
      teamB.push({ ...p, team: "B" });
      sumB += v;
    }
  }

  return {
    teams: [...teamA, ...teamB],
    scoreA: sumA,
    scoreB: sumB,
    isBalanced: Math.abs(sumA - sumB) <= 1,
  };
}

/**
 * Cosine similarity between user's tag history and a stadium's features.
 * Used to rank stadium recommendations for a player.
 */
function tokenize(text: string) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function tf(tokens: string[]) {
  const map = new Map<string, number>();
  for (const t of tokens) map.set(t, (map.get(t) ?? 0) + 1);
  return map;
}

function cosine(a: Map<string, number>, b: Map<string, number>) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, v] of a) na += v * v;
  for (const [, v] of b) nb += v * v;
  for (const [k, v] of a) dot += v * (b.get(k) ?? 0);
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function recommendStadiums(
  user: Pick<User, "position" | "skillLevel" | "bio"> | null,
  stadiums: Stadium[],
  topN = 6,
): Stadium[] {
  if (!user) return stadiums.slice(0, topN);
  const profileTokens = tokenize(
    [user.position, user.skillLevel, user.bio].filter(Boolean).join(" "),
  );
  const profile = tf(profileTokens);
  if (!profileTokens.length) return stadiums.slice(0, topN);

  const ranked = stadiums
    .map((s) => {
      const stTokens = tokenize(
        [s.name, s.description, s.location, ...(s.features ?? [])].join(" "),
      );
      return { s, score: cosine(profile, tf(stTokens)) };
    })
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, topN).map((x) => x.s);
}

/**
 * Suggest top time-slots from historical bookings (lower frequency == better
 * availability). Slots like "10:00", "11:00"...
 */
export function suggestSlots(
  bookings: Booking[],
  hours: number[] = Array.from({ length: 14 }, (_, i) => i + 10),
): { slot: string; score: number }[] {
  const counts = new Map<number, number>();
  for (const b of bookings) {
    const t = b.startTime;
    const date =
      t instanceof Date
        ? t
        : t instanceof Timestamp
        ? t.toDate()
        : null;
    if (!date) continue;
    const h = date.getHours();
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  const max = Math.max(1, ...counts.values());
  return hours.map((h) => ({
    slot: `${String(h).padStart(2, "0")}:00`,
    score: 1 - (counts.get(h) ?? 0) / max,
  }));
}

/**
 * Rolling mean prediction for owner peak-hour planning.
 */
export function predictBusyHours(
  bookings: Booking[],
): { hour: number; load: number }[] {
  const buckets = new Array(24).fill(0);
  for (const b of bookings) {
    const t = b.startTime;
    const date =
      t instanceof Date
        ? t
        : t instanceof Timestamp
        ? t.toDate()
        : null;
    if (!date) continue;
    buckets[date.getHours()] += 1;
  }
  const max = Math.max(1, ...buckets);
  return buckets.map((v, i) => ({
    hour: i,
    load: v / max,
  }));
}
