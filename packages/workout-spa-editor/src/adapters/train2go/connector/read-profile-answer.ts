/**
 * How the Connector reads Train2Go's profile ping when it links an athlete:
 * `success` with a `data.user` is a live session naming the athlete; anything
 * else names no one. Only the id and name are kept; the coach's name and
 * notes in the same answer are dropped here.
 */
import type { RawAnswer } from "../../bridge/thin-bridge-request";

type ProfilePing = {
  success?: boolean;
  data?: { user?: { id?: number | string; name?: string } } | null;
};

export type ProfileAnswer = {
  sessionActive: boolean;
  userId?: number | string;
  userName?: string;
};

export const readProfileAnswer = (answer: RawAnswer): ProfileAnswer => {
  const ping = (JSON.parse(answer.body) as ProfilePing | null) ?? {};
  const user = ping.success === true ? ping.data?.user : undefined;
  if (!user) return { sessionActive: false };
  return { sessionActive: true, userId: user.id, userName: user.name };
};
