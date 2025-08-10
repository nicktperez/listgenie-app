// lib/adminGuard.js
export function isAdminRequest(req) {
    const h = req.headers["x-admin-token"] || req.headers["X-Admin-Token"];
    return h && String(h) === String(process.env.ADMIN_TOKEN);
  }