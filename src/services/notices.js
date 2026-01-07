import { apiDelete, apiGet, apiPost } from "./api";

export function fetchNotices({
  page = 1,
  limit = 6,
  search = "",
  category = "",
  sex = "",
  species = "",
  location = "",
  sort = "", 
} = {}) {

  return apiGet("/notices", {
    page,
    limit,
    search,
    keyword: search,
    title: search,
    category,
    sex,
    species,
    location,
    city: location,
    sort,
  });
}

export function fetchNoticeCategories() {
  return apiGet("/notices/categories");
}
export function fetchNoticeSex() {
  return apiGet("/notices/sex");
}
export function fetchNoticeSpecies() {
  return apiGet("/notices/species");
}


export function fetchCities() {
  return apiGet("/cities/locations");
}

export function addFavoriteNotice(id) {
  return apiPost(`/notices/favorites/add/${id}`);
}

export function removeFavoriteNotice(id) {
  return apiDelete(`/notices/favorites/remove/${id}`);
}
