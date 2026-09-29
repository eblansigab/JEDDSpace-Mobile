import { supabase } from "@/lib/supabase";
import { getCurrentEmployeeId } from "@/lib/AuthContext";

export const REACTION_OPTIONS = ["👍", "❤️", "😂", "🎉", "😮", "😢"] as const;

export type ReactionKey = typeof REACTION_OPTIONS[number];

export type ReactionState = Partial<Record<ReactionKey, boolean>>;

export type ReactionCounts = Partial<Record<ReactionKey, number>>;

export type ReactionResult = {
  mine: ReactionState;
  counts: ReactionCounts;
};

type ReactionRow = { reaction_type: string };

/**
 * Returns the Supabase auth user UUID. Used only for tables keyed on the auth
 * user id (e.g. announcement_seen), which is distinct from employee_id below.
 */
async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

function buildReactionMap(rows: ReactionRow[]): ReactionState {
  const map: ReactionState = {};
  rows.forEach((row) => {
    const key = String(row.reaction_type) as ReactionKey;
    if ((REACTION_OPTIONS as readonly string[]).includes(key)) {
      map[key] = true;
    }
  });
  return map;
}

function buildCountMap(rows: ReactionRow[]): ReactionCounts {
  const map: ReactionCounts = {};
  rows.forEach((row) => {
    const key = String(row.reaction_type) as ReactionKey;
    if ((REACTION_OPTIONS as readonly string[]).includes(key)) {
      map[key] = (map[key] || 0) + 1;
    }
  });
  return map;
}

export async function getAnnouncementReactions(announcementId: string | number): Promise<ReactionState> {
  try {
    const employeeId = await getCurrentEmployeeId();
    if (!employeeId) {
      return {};
    }

    const numericId = Number(announcementId);

    const { data, error } = await supabase
      .from("announcement_reactions")
      .select("reaction_type")
      .eq("announcement_id", numericId)
      .eq("employee_id", employeeId);

    if (error || !data) {
      return {};
    }

    return buildReactionMap(data as ReactionRow[]);
  } catch {
    return {};
  }
}

export async function getAnnouncementReactionCounts(announcementId: string | number): Promise<ReactionCounts> {
  try {
    const numericId = Number(announcementId);

    const { data, error } = await supabase
      .from("announcement_reactions")
      .select("reaction_type")
      .eq("announcement_id", numericId);

    if (error || !data) {
      return {};
    }

    return buildCountMap(data as ReactionRow[]);
  } catch {
    return {};
  }
}

export async function toggleAnnouncementReaction(announcementId: string | number, reaction: ReactionKey): Promise<ReactionResult> {
  const employeeId = await getCurrentEmployeeId();
  if (!employeeId) {
    return { mine: {}, counts: {} };
  }

  const numericId = Number(announcementId);

  const { data: existing, error: lookupError } = await supabase
    .from("announcement_reactions")
    .select("reaction_type")
    .eq("announcement_id", numericId)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (lookupError) {
    console.error("[reactionService] Announcement reaction lookup failed:", lookupError);
    return { mine: {}, counts: {} };
  }

  if (existing) {
    if (existing.reaction_type === reaction) {
      const { error: deleteError } = await supabase
        .from("announcement_reactions")
        .delete()
        .eq("announcement_id", numericId)
        .eq("employee_id", employeeId);

      if (deleteError) {
        console.error("[reactionService] Announcement reaction delete failed:", deleteError);
      }
    } else {
      const { error: updateError } = await supabase
        .from("announcement_reactions")
        .update({ reaction_type: reaction })
        .eq("announcement_id", numericId)
        .eq("employee_id", employeeId);

      if (updateError) {
        console.error("[reactionService] Announcement reaction update failed:", updateError);
        return { mine: {}, counts: {} };
      }
    }
  } else {
    const { error: insertError } = await supabase
      .from("announcement_reactions")
      .insert({ announcement_id: numericId, employee_id: employeeId, reaction_type: reaction });

    if (insertError) {
      console.error("[reactionService] Announcement reaction insert failed:", insertError);
      return { mine: {}, counts: {} };
    }
  }

  const [mine, counts] = await Promise.all([
    getAnnouncementReactions(announcementId),
    getAnnouncementReactionCounts(announcementId),
  ]);

  return { mine, counts };
}

export async function getMessageReactions(messageId: number): Promise<ReactionState> {
  try {
    const employeeId = await getCurrentEmployeeId();
    if (!employeeId) {
      return {};
    }

    const { data, error } = await supabase
      .from("message_reactions")
      .select("reaction_type")
      .eq("email_id", messageId)
      .eq("employee_id", employeeId);

    if (error || !data) {
      return {};
    }

    return buildReactionMap(data as ReactionRow[]);
  } catch {
    return {};
  }
}

export async function getMessageReactionCounts(messageId: number): Promise<ReactionCounts> {
  try {
    const { data, error } = await supabase
      .from("message_reactions")
      .select("reaction_type")
      .eq("email_id", messageId);

    if (error || !data) {
      return {};
    }

    return buildCountMap(data as ReactionRow[]);
  } catch {
    return {};
  }
}

export async function toggleMessageReaction(messageId: number, reaction: ReactionKey): Promise<ReactionResult> {
  const employeeId = await getCurrentEmployeeId();
  if (!employeeId) {
    return { mine: {}, counts: {} };
  }

  const { data: existing } = await supabase
    .from("message_reactions")
    .select("reaction_type")
    .eq("email_id", messageId)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (existing) {
    if (existing.reaction_type === reaction) {
      const { error: deleteError } = await supabase
        .from("message_reactions")
        .delete()
        .eq("email_id", messageId)
        .eq("employee_id", employeeId);

      if (deleteError) {
        console.error("[reactionService] Message reaction delete failed:", deleteError);
      }
    } else {
      const { error: updateError } = await supabase
        .from("message_reactions")
        .update({ reaction_type: reaction })
        .eq("email_id", messageId)
        .eq("employee_id", employeeId);

      if (updateError) {
        console.error("[reactionService] Message reaction update failed:", updateError);
        return { mine: {}, counts: {} };
      }
    }
  } else {
    const { error: insertError } = await supabase
      .from("message_reactions")
      .insert({ email_id: messageId, employee_id: employeeId, reaction_type: reaction });

    if (insertError) {
      console.error("[reactionService] Message reaction insert failed:", insertError);
      return { mine: {}, counts: {} };
    }
  }

  const [mine, counts] = await Promise.all([
    getMessageReactions(messageId),
    getMessageReactionCounts(messageId),
  ]);

  return { mine, counts };
}

export async function getSeenAnnouncementIds(): Promise<string[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

    const { data, error } = await supabase
      .from("announcement_seen")
      .select("announcement_id")
      .eq("user_id", userId);

    if (error || !data) {
      return [];
    }

    return data.map((row) => String(row.announcement_id));
  } catch {
    return [];
  }
}

export async function markAnnouncementAsSeen(announcementId: string): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return [];
  }

  await supabase
    .from("announcement_seen")
    .upsert({ user_id: userId, announcement_id: announcementId, seen_at: new Date().toISOString() });

  return getSeenAnnouncementIds();
}
