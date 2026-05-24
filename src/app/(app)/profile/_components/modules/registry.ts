import type { Role } from "@/types";
import type { ModuleSlot } from "./types";

// Player modules
import { PlayerPresenceTiles } from "./player/PlayerPresenceTiles";
import { PlayerFootballIdentity } from "./player/PlayerFootballIdentity";
import { PlayerRecentActivity } from "./player/PlayerRecentActivity";

// Owner modules
import { OwnerPresenceTiles } from "./owner/OwnerPresenceTiles";
import { OwnerStadiumPortfolio } from "./owner/OwnerStadiumPortfolio";
import { OwnerTrustCard } from "./owner/OwnerTrustCard";

// Admin modules
import { AdminScopeTiles } from "./admin/AdminScopeTiles";
import { AdminActivityCard } from "./admin/AdminActivityCard";
import { AdminSecurityCard } from "./admin/AdminSecurityCard";

/**
 * Maps each role to an ordered list of module slots.
 *
 * colSpan "full"  → md:col-span-2 (takes the whole row)
 * colSpan "half"  → md:col-span-1 (fills one of two columns)
 *
 * To add a module: import the component and append a slot here.
 * To reorder:     move the slot entry.
 * To hide:        remove the slot entry.
 *
 * Do NOT add role-branching logic outside this file.
 */
export const PROFILE_MODULES: Record<Role, ModuleSlot[]> = {
  PLAYER: [
    { key: "player-presence",  Component: PlayerPresenceTiles,    colSpan: "full" },
    { key: "player-identity",  Component: PlayerFootballIdentity, colSpan: "half" },
    { key: "player-activity",  Component: PlayerRecentActivity,   colSpan: "half" },
  ],

  OWNER: [
    { key: "owner-presence",   Component: OwnerPresenceTiles,     colSpan: "full" },
    { key: "owner-portfolio",  Component: OwnerStadiumPortfolio,  colSpan: "half" },
    { key: "owner-trust",      Component: OwnerTrustCard,         colSpan: "half" },
  ],

  SUPER_ADMIN: [
    { key: "admin-scope",      Component: AdminScopeTiles,        colSpan: "full" },
    { key: "admin-activity",   Component: AdminActivityCard,      colSpan: "half" },
    { key: "admin-security",   Component: AdminSecurityCard,      colSpan: "half" },
  ],
};
