const FAV_KEY = "petlove-favorites";
const VIEWED_KEY = "petlove-viewed";

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : fallback;
    return data ?? fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("petlove-notices-changed"));
}

export function readFavorites() {
  const arr = safeParse(FAV_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

export function readViewed() {
  const arr = safeParse(VIEWED_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

export function isFavId(id) {
  if (!id) return false;
  return readFavorites().some((x) => String(x?.id) === String(id));
}

export function upsertFavorite(item, fav) {
  if (!item) return;

  const id = String(item.id);
  const prev = readFavorites();

  let next;
  if (fav) {
    
    const clean = prev.filter((x) => String(x?.id) !== id);
    next = [{ ...item, id }, ...clean].slice(0, 50);
  } else {
    
    next = prev.filter((x) => String(x?.id) !== id);
  }

  safeWrite(FAV_KEY, next);
}

export function pushViewed(item) {
  if (!item) return;
  const id = String(item.id);
  const prev = readViewed();

  const clean = prev.filter((x) => String(x?.id) !== id);
  const next = [{ ...item, id }, ...clean].slice(0, 50);

  safeWrite(VIEWED_KEY, next);
}

export function removeViewed(id) {
  const prev = readViewed();
  const next = prev.filter((x) => String(x?.id) !== String(id));
  safeWrite(VIEWED_KEY, next);
}
