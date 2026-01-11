const LEGACY_FAV_KEY = "petlove-favorites";
const LEGACY_VIEWED_KEY = "petlove-viewed";

function safeParseArray(raw) {
  try {
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function safeRead(key) {
  try {
    return safeParseArray(localStorage.getItem(key));
  } catch {
    return [];
  }
}

function safeWrite(key, arr) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
  } catch {}
}

function mergeByIdKeepLatestTs(base = [], incoming = []) {
  const map = new Map();
  [...base, ...incoming].forEach((it) => {
    const id = it?.id;
    if (!id) return;
    const k = String(id);

    const prev = map.get(k);
    if (!prev) {
      map.set(k, it);
      return;
    }
    const prevTs = Number(prev?.ts || 0);
    const nextTs = Number(it?.ts || 0);
    map.set(k, nextTs >= prevTs ? it : prev);
  });

  return Array.from(map.values()).sort(
    (a, b) => Number(b?.ts || 0) - Number(a?.ts || 0)
  );
}


export function getUserStorageId(user) {
  const raw =
    user?._id ||
    user?.id ||
    user?.uid ||
    user?.userId ||
    user?.firebaseUid ||
    user?.email;

  if (!raw) return null;

  const s = String(raw).trim();
  if (!s) return null;

  if (s.includes("@")) return s.toLowerCase();
  return s;
}

export function favKey(userOrId) {
  const id =
    typeof userOrId === "string" ? userOrId : getUserStorageId(userOrId);
  return id ? `petlove-favorites:${id}` : LEGACY_FAV_KEY;
}

export function viewedKey(userOrId) {
  const id =
    typeof userOrId === "string" ? userOrId : getUserStorageId(userOrId);
  return id ? `petlove-viewed:${id}` : LEGACY_VIEWED_KEY;
}

export function readFavs(userOrId) {
  return safeRead(favKey(userOrId));
}

export function readViewed(userOrId) {
  return safeRead(viewedKey(userOrId));
}

export function writeFavs(userOrId, arr) {
  safeWrite(favKey(userOrId), arr);
  window.dispatchEvent(new Event("petlove-favs-changed"));
}

export function writeViewed(userOrId, arr) {
  safeWrite(viewedKey(userOrId), arr);
  window.dispatchEvent(new Event("petlove-viewed-changed"));
}

export function migrateLegacyToUser(user) {
  const id = getUserStorageId(user);
  if (!id) return;

  const userFavK = favKey(id);
  const userViewedK = viewedKey(id);

  const legacyFavs = safeRead(LEGACY_FAV_KEY);
  const legacyViewed = safeRead(LEGACY_VIEWED_KEY);

  if (legacyFavs.length) {
    const current = safeRead(userFavK);
    const merged = mergeByIdKeepLatestTs(current, legacyFavs);
    safeWrite(userFavK, merged);
  }

  if (legacyViewed.length) {
    const current = safeRead(userViewedK);
    const merged = mergeByIdKeepLatestTs(current, legacyViewed);
    safeWrite(userViewedK, merged);
  }

  if (legacyFavs.length) {
    try {
      localStorage.removeItem(LEGACY_FAV_KEY);
    } catch {}
  }
  if (legacyViewed.length) {
    try {
      localStorage.removeItem(LEGACY_VIEWED_KEY);
    } catch {}
  }
}
