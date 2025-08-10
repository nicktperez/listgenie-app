// pages/api/_whoami.js
import { getAuth } from "@clerk/nextjs/server";

export default function handler(req, res) {
  const a = getAuth(req);
  return res.status(200).json({
    ok: true,
    userId: a?.userId || null,
    hasSession: !!a?.sessionId,
  });
}