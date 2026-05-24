import type { Timestamp } from "firebase/firestore";

// =============================================================================
// Core
// =============================================================================
export type Role = "PLAYER" | "OWNER" | "SUPER_ADMIN";
export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO";
export type Position = "GK" | "DEF" | "MID" | "FWD" | "ANY";
export type FsTimestamp = Timestamp | Date;

export interface UserStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  assists: number;
  mvp: number;
  rating: number; // 0–100
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: Role;
  bio?: string;
  position?: Position;
  skillLevel?: SkillLevel;
  walletBalance?: number;
  stats?: UserStats;
  createdAt: FsTimestamp;
}

// =============================================================================
// Stadium
// =============================================================================
export interface Stadium {
  id?: string;
  ownerId: string;
  name: string;
  description: string;
  location: string;
  pricePerHour: number;
  features: string[];
  images: string[];
  rating?: number;
  approved?: boolean;
  createdAt: FsTimestamp;
}

// =============================================================================
// Booking + payments
// =============================================================================
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentStatus = "UNPAID" | "PROCESSING" | "PAID" | "REFUNDED";

export interface Booking {
  id?: string;
  stadiumId: string;
  stadiumName?: string;
  userId: string;
  userName?: string;
  startTime: FsTimestamp;
  endTime: FsTimestamp;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paymentId?: string;
  stripePaymentIntentId?: string;
  qrCode?: string;
  ticketCode?: string;
  createdAt: FsTimestamp;
}

export interface Invoice {
  id?: string;
  bookingId: string;
  userId: string;
  amount: number;
  fees: number;
  total: number;
  pdfUrl?: string;
  issuedAt: FsTimestamp;
}

export type WalletTxKind = "TOPUP" | "BOOKING" | "REFUND" | "BONUS";
export interface WalletTransaction {
  id?: string;
  userId: string;
  kind: WalletTxKind;
  amount: number;
  description: string;
  bookingId?: string;
  createdAt: FsTimestamp;
}

// =============================================================================
// Teams
// =============================================================================
export interface TeamStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface Team {
  id?: string;
  name: string;
  tag?: string; // e.g. "BLR"
  description?: string;
  logoUrl?: string;
  captainId: string;
  memberIds: string[];
  stats: TeamStats;
  createdAt: FsTimestamp;
}

export interface TeamMember {
  id?: string;
  teamId: string;
  userId: string;
  role: "CAPTAIN" | "MEMBER";
  position?: Position;
  joinedAt: FsTimestamp;
}

export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED";
export interface TeamInvite {
  id?: string;
  teamId: string;
  teamName: string;
  invitedBy: string; // userId
  invitedUserId?: string; // resolved invitee
  email?: string;
  status: InviteStatus;
  createdAt: FsTimestamp;
}

export interface TeamMessage {
  id?: string;
  teamId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: FsTimestamp;
}

// =============================================================================
// Events
// =============================================================================
export type EventVisibility = "PUBLIC" | "PRIVATE";
export type EventStatus = "UPCOMING" | "LIVE" | "FINISHED" | "CANCELLED";

export interface SportEvent {
  id?: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  stadiumId?: string;
  stadiumName?: string;
  location?: string;
  startTime: FsTimestamp;
  endTime: FsTimestamp;
  capacity: number;
  participantIds: string[];
  visibility: EventVisibility;
  status: EventStatus;
  pricePerSeat?: number;
  coverImage?: string;
  createdAt: FsTimestamp;
}

export interface EventParticipant {
  id?: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  position?: Position;
  skillLevel?: SkillLevel;
  team?: "A" | "B";
  joinedAt: FsTimestamp;
}

// =============================================================================
// Social feed
// =============================================================================
export interface Post {
  id?: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  imageUrl?: string;
  likes: number;
  likedBy: string[];
  comments: number;
  flagged?: boolean;
  moderationLabel?: string;
  createdAt: FsTimestamp;
}

export interface Comment {
  id?: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: FsTimestamp;
}

// =============================================================================
// Notifications
// =============================================================================
export type NotificationType =
  | "BOOKING"
  | "TEAM"
  | "EVENT"
  | "PAYMENT"
  | "MESSAGE"
  | "SYSTEM";

export interface AppNotification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: FsTimestamp;
  /** UID of the user who triggered this notification (liker, commenter, etc.) */
  actorId?: string;
  /** Display name of the actor — used for initials fallback */
  actorName?: string;
  /** Avatar URL of the actor — shown instead of the generic type icon */
  actorPhoto?: string;
}

// =============================================================================
// Support
// =============================================================================
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Ticket {
  id?: string;
  userId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  createdAt: FsTimestamp;
  updatedAt: FsTimestamp;
}

export interface TicketMessage {
  id?: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  fromSupport: boolean;
  text: string;
  createdAt: FsTimestamp;
}
