import { apiGet } from "./api";

export async function fetchNews({ page = 1, limit = 6, search = "" } = {}) {
  
  return apiGet("/news", {
    page,
    limit,
    search, 
  });
}
