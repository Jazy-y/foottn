import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  User,
  Stadium,
  Booking,
  Team,
  TeamMember,
  TeamInvite,
  TeamMessage,
  SportEvent,
  EventParticipant,
  Post,
  Comment,
  AppNotification,
  Ticket,
  TicketMessage,
  WalletTransaction,
  Invoice,
} from "@/types";

const ts = () => serverTimestamp();

// =============================================================================
// USERS
// =============================================================================
export const createUserProfile = async (
  userId: string,
  data: Partial<User>,
) => {
  const ref = doc(db, "users", userId);
  const existing = await getDoc(ref);
  if (existing.exists()) return; // idempotent for Google sign-in
  await setDoc(
    ref,
    {
      ...data,
      walletBalance: 0,
      stats: {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals: 0,
        assists: 0,
        mvp: 0,
        rating: 50,
      },
      createdAt: ts(),
    },
    { merge: true },
  );
};

export const getUserProfile = async (userId: string) => {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as User) : null;
};

export const updateUserProfile = async (
  userId: string,
  data: Partial<User>,
) => updateDoc(doc(db, "users", userId), data);

export const deleteUserProfile = async (userId: string) =>
  deleteDoc(doc(db, "users", userId));

export const listAllUsers = async () => {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as User);
};

// =============================================================================
// STADIUMS
// =============================================================================
export const createStadium = async (
  data: Omit<Stadium, "id" | "createdAt">,
) => {
  const ref = doc(collection(db, "stadiums"));
  await setDoc(ref, { ...data, id: ref.id, approved: false, createdAt: ts() });
  return ref.id;
};

export const deleteStadium = (id: string) =>
  deleteDoc(doc(db, "stadiums", id));

export const updateStadium = (id: string, data: Partial<Stadium>) =>
  updateDoc(doc(db, "stadiums", id), data);

// Public-facing query — only returns approved stadiums (no auth required).
export const getAllStadiums = async () => {
  const snap = await getDocs(
    query(collection(db, "stadiums"), where("approved", "==", true)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stadium);
};

// Admin-only query — returns ALL stadiums regardless of approval status.
// Firestore rules allow admins to read every document.
export const getAllStadiumsAdmin = async () => {
  const snap = await getDocs(
    query(collection(db, "stadiums"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stadium);
};

export const getStadiumsByOwner = async (ownerId: string) => {
  const snap = await getDocs(
    query(collection(db, "stadiums"), where("ownerId", "==", ownerId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Stadium);
};

export const getStadiumById = async (id: string) => {
  const snap = await getDoc(doc(db, "stadiums", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Stadium) : null;
};

// =============================================================================
// BOOKINGS
// =============================================================================
export const createBooking = async (
  data: Omit<Booking, "id" | "status" | "createdAt" | "ticketCode">,
) => {
  const ref = doc(collection(db, "bookings"));
  const ticketCode = `FT-${ref.id.slice(0, 8).toUpperCase()}`;
  await setDoc(ref, {
    ...data,
    id: ref.id,
    startTime:
      data.startTime instanceof Date
        ? Timestamp.fromDate(data.startTime)
        : data.startTime,
    endTime:
      data.endTime instanceof Date
        ? Timestamp.fromDate(data.endTime)
        : data.endTime,
    status: "PENDING",
    paymentStatus: "UNPAID",
    ticketCode,
    createdAt: ts(),
  });
  return ref.id;
};

export const updateBookingStatus = (
  id: string,
  status: Booking["status"],
) => updateDoc(doc(db, "bookings", id), { status });

export const updateBookingPayment = (
  id: string,
  paymentStatus: string,
  paymentMethod: string,
  stripePaymentIntentId?: string,
) =>
  updateDoc(doc(db, "bookings", id), {
    paymentStatus,
    paymentMethod,
    ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
    status: "CONFIRMED",
  });

export const getAllBookings = async () => {
  const snap = await getDocs(
    query(collection(db, "bookings"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
};

export const getUserBookings = async (userId: string) => {
  const snap = await getDocs(
    query(
      collection(db, "bookings"),
      where("userId", "==", userId),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
};

export const getStadiumBookings = async (stadiumId: string) => {
  const snap = await getDocs(
    query(collection(db, "bookings"), where("stadiumId", "==", stadiumId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking);
};

export const getOwnerBookings = async (ownerId: string) => {
  // simple two-step query: first owner stadiums, then bookings for them
  const stadiums = await getStadiumsByOwner(ownerId);
  if (!stadiums.length) return [];
  const stadiumMap = new Map(stadiums.map((s) => [s.id, s.name]));
  const ids = stadiums.map((s) => s.id!).filter(Boolean);
  if (!ids.length) return [];
  const snap = await getDocs(
    query(collection(db, "bookings"), where("stadiumId", "in", ids.slice(0, 10))),
  );
  
  const userIds = [...new Set(snap.docs.map(d => d.data().userId))];
  const userMap = new Map();
  if (userIds.length > 0) {
    const usersSnap = await getDocs(query(collection(db, "users"), where("__name__", "in", userIds.slice(0, 10))));
    usersSnap.docs.forEach(d => userMap.set(d.id, d.data().displayName || d.data().email));
  }

  return snap.docs.map((d) => {
    const data = d.data();
    return { 
      id: d.id, 
      ...data, 
      stadiumName: stadiumMap.get(data.stadiumId) || data.stadiumId,
      userName: userMap.get(data.userId) || data.userId.slice(0, 8)
    } as Booking;
  });
};

export const getBookingById = async (id: string) => {
  const snap = await getDoc(doc(db, "bookings", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null;
};

// =============================================================================
// TEAMS
// =============================================================================
export const createTeam = async (data: Omit<Team, "id" | "createdAt" | "stats">) => {
  const ref = doc(collection(db, "teams"));
  await setDoc(ref, {
    ...data,
    id: ref.id,
    stats: {
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    createdAt: ts(),
  });
  return ref.id;
};

export const getTeamById = async (id: string) => {
  const snap = await getDoc(doc(db, "teams", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Team) : null;
};

export const getAllTeams = async () => {
  const snap = await getDocs(query(collection(db, "teams"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Team);
};

export const getUserTeams = async (userId: string) => {
  const snap = await getDocs(
    query(collection(db, "teams"), where("memberIds", "array-contains", userId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Team);
};

export const addTeamMember = async (teamId: string, userId: string) => {
  await updateDoc(doc(db, "teams", teamId), {
    memberIds: arrayUnion(userId),
  });
  await addDoc(collection(db, "teamMembers"), {
    teamId,
    userId,
    role: "MEMBER",
    joinedAt: ts(),
  } satisfies Omit<TeamMember, "id" | "joinedAt"> & { joinedAt: ReturnType<typeof ts> });
};

export const removeTeamMember = (teamId: string, userId: string) =>
  updateDoc(doc(db, "teams", teamId), { memberIds: arrayRemove(userId) });

export const deleteTeam = (teamId: string) =>
  deleteDoc(doc(db, "teams", teamId));

export const createTeamInvite = async (
  data: Omit<TeamInvite, "id" | "status" | "createdAt">,
) => {
  const ref = await addDoc(collection(db, "teamInvites"), {
    ...data,
    status: "PENDING",
    createdAt: ts(),
  });
  return ref.id;
};

export const getUserInvites = async (userId: string) => {
  const snap = await getDocs(
    query(
      collection(db, "teamInvites"),
      where("invitedUserId", "==", userId),
      where("status", "==", "PENDING"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamInvite);
};

export const respondToInvite = (inviteId: string, accepted: boolean) =>
  updateDoc(doc(db, "teamInvites", inviteId), {
    status: accepted ? "ACCEPTED" : "DECLINED",
  });

export const sendTeamMessage = async (
  data: Omit<TeamMessage, "id" | "createdAt">,
) => {
  await addDoc(collection(db, "teamMessages"), {
    ...data,
    createdAt: ts(),
  });
};

export const subscribeToTeamMessages = (
  teamId: string,
  cb: (msgs: TeamMessage[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "teamMessages"),
    where("teamId", "==", teamId),
    orderBy("createdAt", "asc"),
    limit(200),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TeamMessage));
  });
};

// =============================================================================
// EVENTS
// =============================================================================
export const createEvent = async (
  data: Omit<SportEvent, "id" | "status" | "createdAt" | "participantIds">,
) => {
  const ref = doc(collection(db, "events"));
  await setDoc(ref, {
    ...data,
    id: ref.id,
    participantIds: [],
    status: "UPCOMING",
    startTime:
      data.startTime instanceof Date
        ? Timestamp.fromDate(data.startTime)
        : data.startTime,
    endTime:
      data.endTime instanceof Date
        ? Timestamp.fromDate(data.endTime)
        : data.endTime,
    createdAt: ts(),
  });
  return ref.id;
};

export const getEventById = async (id: string) => {
  const snap = await getDoc(doc(db, "events", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as SportEvent) : null;
};

export const getAllEvents = async () => {
  const snap = await getDocs(
    query(collection(db, "events"), orderBy("startTime", "asc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SportEvent);
};

export const joinEvent = async (
  eventId: string,
  participant: Omit<EventParticipant, "id" | "joinedAt" | "eventId">,
) => {
  const ref = doc(db, "events", eventId);
  await updateDoc(ref, {
    participantIds: arrayUnion(participant.userId),
  });
  await addDoc(collection(db, "eventParticipants"), {
    ...participant,
    eventId,
    joinedAt: ts(),
  });
  
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data() as SportEvent;
    if (data.hostId !== participant.userId) {
      createNotification({
        userId: data.hostId,
        type: "EVENT",
        title: "Nouveau Participant 🏃",
        body: `${participant.userName} a rejoint votre événement "${data.title}".`,
        href: `/events/${eventId}`
      }).catch(() => {});
    }
  }
};

export const leaveEvent = (eventId: string, userId: string) =>
  updateDoc(doc(db, "events", eventId), {
    participantIds: arrayRemove(userId),
  });

export const getEventParticipants = async (eventId: string) => {
  const snap = await getDocs(
    query(collection(db, "eventParticipants"), where("eventId", "==", eventId)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EventParticipant);
};

export const deleteEvent = async (eventId: string) => {
  await deleteDoc(doc(db, "events", eventId));
};

// =============================================================================
// FEED
// =============================================================================
export const createPost = async (
  data: Omit<Post, "id" | "likes" | "likedBy" | "comments" | "createdAt">,
) => {
  const ref = await addDoc(collection(db, "posts"), {
    ...data,
    likes: 0,
    likedBy: [],
    comments: 0,
    createdAt: ts(),
  });
  return ref.id;
};

export const updatePost = async (postId: string, data: Partial<Pick<Post, "text" | "imageUrl">>) => {
  const ref = doc(db, "posts", postId);
  await updateDoc(ref, data);
};

export const getRecentPosts = async (max = 50) => {
  const snap = await getDocs(
    query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(max)),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post);
};

export const togglePostLike = async (
  postId: string,
  userId: string,
  userName?: string,
  userPhoto?: string,
) => {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Post;
  const liked = data.likedBy?.includes(userId);
  await updateDoc(ref, {
    likedBy: liked ? arrayRemove(userId) : arrayUnion(userId),
    likes: increment(liked ? -1 : 1),
  });

  if (!liked && data.authorId !== userId) {
    // Notification is fire-and-forget — never let it break the like action
    createNotification({
      userId: data.authorId,
      type: "SYSTEM",
      title: "Nouveau J'aime ❤️",
      body: `${userName || "Quelqu'un"} a aimé votre publication.`,
      href: "/feed",
      actorId: userId,
      actorName: userName,
      ...(userPhoto ? { actorPhoto: userPhoto } : {}),
    }).catch(() => {});
  }
};

export const flagPost = async (postId: string, reason?: string) => {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  await updateDoc(ref, { 
    flagged: true,
    ...(reason ? { moderationLabel: reason } : {})
  });
  
  if (snap.exists()) {
    const data = snap.data() as Post;
    createNotification({
      userId: data.authorId,
      type: "SYSTEM",
      title: "Publication Signalée ⚠️",
      body: `Votre publication a été signalée pour la raison suivante : ${reason || "Non spécifié"}.`,
      href: "/feed"
    }).catch(() => {});
  }
};

export const unflagPost = async (postId: string) => {
  const ref = doc(db, "posts", postId);
  await updateDoc(ref, { flagged: false });
};

export const deletePost = async (postId: string) => {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data() as Post;
    createNotification({
      userId: data.authorId,
      type: "SYSTEM",
      title: "Publication Supprimée 🗑️",
      body: `Une de vos publications a été supprimée par un administrateur.`,
    }).catch(() => {});
  }
  await deleteDoc(ref);
};

export const addComment = async (
  postId: string,
  data: Omit<Comment, "id" | "createdAt" | "postId">,
) => {
  await addDoc(collection(db, "comments"), {
    ...data,
    postId,
    createdAt: ts(),
  });
  await updateDoc(doc(db, "posts", postId), { comments: increment(1) });
  
  const postSnap = await getDoc(doc(db, "posts", postId));
  if (postSnap.exists()) {
    const postData = postSnap.data() as Post;
    if (postData.authorId !== data.authorId) {
      // Fire-and-forget — notification failure must not break the comment
      createNotification({
        userId: postData.authorId,
        type: "SYSTEM",
        title: "Nouveau Commentaire 💬",
        body: `${data.authorName} a commenté votre publication.`,
        href: "/feed",
        actorId: data.authorId,
        actorName: data.authorName,
        ...(data.authorPhoto ? { actorPhoto: data.authorPhoto } : {}),
      }).catch(() => {});
    }
  }
};

export const getPostComments = async (postId: string) => {
  const snap = await getDocs(
    query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment);
};

// =============================================================================
// NOTIFICATIONS
// =============================================================================
export const createNotification = (
  data: Omit<AppNotification, "id" | "read" | "createdAt">,
) =>
  addDoc(collection(db, "notifications"), {
    ...data,
    read: false,
    createdAt: ts(),
  });

export const subscribeToUserNotifications = (
  userId: string,
  cb: (n: AppNotification[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(30),
  );
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AppNotification));
    },
    (err) => {
      console.error("Notifications listener error:", err);
    }
  );
};

export const markNotificationRead = (id: string) =>
  updateDoc(doc(db, "notifications", id), { read: true });

// =============================================================================
// TICKETS
// =============================================================================
export const createTicket = async (
  data: Omit<Ticket, "id" | "status" | "createdAt" | "updatedAt">,
) => {
  const ref = await addDoc(collection(db, "tickets"), {
    ...data,
    status: "OPEN",
    createdAt: ts(),
    updatedAt: ts(),
  });
  return ref.id;
};

export const getUserTickets = async (userId: string) => {
  const snap = await getDocs(
    query(
      collection(db, "tickets"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket);
};

export const getTicketById = async (id: string) => {
  const snap = await getDoc(doc(db, "tickets", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Ticket) : null;
};

export const addTicketMessage = async (
  data: Omit<TicketMessage, "id" | "createdAt">,
) => {
  await addDoc(collection(db, "ticketMessages"), {
    ...data,
    createdAt: ts(),
  });
  await updateDoc(doc(db, "tickets", data.ticketId), { updatedAt: ts() });
};

export const subscribeToTicketMessages = (
  ticketId: string,
  cb: (msgs: TicketMessage[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, "ticketMessages"),
    where("ticketId", "==", ticketId),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TicketMessage));
  });
};

export const updateTicketStatus = (id: string, status: Ticket["status"]) =>
  updateDoc(doc(db, "tickets", id), { status, updatedAt: ts() });

export const listAllTickets = async () => {
  const snap = await getDocs(
    query(collection(db, "tickets"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket);
};

// =============================================================================
// WALLET
// =============================================================================
export const addWalletTransaction = async (
  data: Omit<WalletTransaction, "id" | "createdAt">,
) => {
  await addDoc(collection(db, "walletTransactions"), {
    ...data,
    createdAt: ts(),
  });
  const sign = data.kind === "TOPUP" || data.kind === "REFUND" || data.kind === "BONUS" ? 1 : -1;
  await updateDoc(doc(db, "users", data.userId), {
    walletBalance: increment(sign * data.amount),
  });
};

export const getUserWalletTx = async (userId: string) => {
  const snap = await getDocs(
    query(
      collection(db, "walletTransactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WalletTransaction);
};

// =============================================================================
// INVOICES
// =============================================================================
export const createInvoice = async (
  data: Omit<Invoice, "id" | "issuedAt">,
) => {
  const ref = await addDoc(collection(db, "invoices"), {
    ...data,
    issuedAt: ts(),
  });
  return ref.id;
};

export const getUserInvoices = async (userId: string) => {
  const snap = await getDocs(
    query(
      collection(db, "invoices"),
      where("userId", "==", userId),
      orderBy("issuedAt", "desc"),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice);
};

// =============================================================================
// PROFILE — lightweight helpers (avoids pulling full collections)
// =============================================================================

export const getUserEventsCount = async (userId: string): Promise<number> => {
  const snap = await getDocs(
    query(collection(db, "events"), where("participantIds", "array-contains", userId)),
  );
  return snap.size;
};

// Admin-only query — returns stadiums pending approval.
// Uses JS filter instead of a Firestore where() so that legacy documents
// created before the approved:false default was added (field absent) are
// also caught. Admins can read the full collection, so no rule issue.
export const getPendingStadiums = async (): Promise<Stadium[]> => {
  const snap = await getDocs(
    query(collection(db, "stadiums"), orderBy("createdAt", "desc")),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Stadium))
    .filter((s) => !s.approved); // catches approved===false AND approved===undefined
};

export const getOpenTicketsCount = async (): Promise<number> => {
  const snap = await getDocs(
    query(collection(db, "tickets"), where("status", "==", "OPEN")),
  );
  return snap.size;
};

export const getFlaggedPostsCount = async (): Promise<number> => {
  const snap = await getDocs(
    query(collection(db, "posts"), where("flagged", "==", true)),
  );
  return snap.size;
};

export const getHighPriorityOpenTickets = async (): Promise<Ticket[]> => {
  const snap = await getDocs(
    query(
      collection(db, "tickets"),
      where("status", "==", "OPEN"),
      where("priority", "==", "HIGH"),
      limit(5),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket));
};

// =============================================================================
// ANALYTICS & TRAFFIC
// =============================================================================
export const logPageVisit = async () => {
  try {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const visitRef = doc(db, "analytics_visits", date);
    await setDoc(
      visitRef,
      {
        date,
        count: increment(1),
        lastUpdated: ts(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Failed to log visit", error);
  }
};

export const getRecentVisits = async (days: number = 7) => {
  try {
    const q = query(
      collection(db, "analytics_visits"),
      orderBy("date", "desc"),
      limit(days)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as { date: string; count: number; lastUpdated: unknown });
  } catch (error) {
    console.error("Failed to fetch visits", error);
    return [];
  }
};
