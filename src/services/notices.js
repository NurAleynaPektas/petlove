import { apiDelete, apiGet, apiPost } from "./api";

function mapSort(sort) {
  switch (sort) {
    case "popular":
      return { sortBy: "popularity", sortOrder: "desc" };
    case "unpopular":
      return { sortBy: "popularity", sortOrder: "asc" };
    case "cheap":
      return { sortBy: "price", sortOrder: "asc" };
    case "expensive":
      return { sortBy: "price", sortOrder: "desc" };
    default:
      return {};
  }
}

export function fetchNotices({
  page = 1,
  perPage = 6,
  search = "",
  category = "",
  sex = "",
  species = "",
  locationId = "",
  sort = "",
} = {}) {
  const { sortBy, sortOrder } = mapSort(sort);

  return apiGet("/notices", {
    page,
    perPage, 
    keyword: search || "", 
    category,
    sex,
    species,
    locationId, 
    sortBy,
    sortOrder,
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

export function fetchNoticeById(id) {
  return apiGet(`/notices/${id}`);
}

export function addFavoriteNotice(id) {
  return apiPost(`/notices/favorites/add/${id}`);
}

export function removeFavoriteNotice(id) {
  return apiDelete(`/notices/favorites/remove/${id}`);
}
