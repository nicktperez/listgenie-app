// pages/api/_whoami.js
import { getAuth } from "@clerk/nextjs/server";

export default function handler(req, res) {
  try {
    const { userId, sessionId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthenticated" });
    }
    return res.status(200).json({
      ok: true,
      userId,
      hasSession: !!sessionId,
    });
  } catch (e) {
    console.error("_whoami error:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}