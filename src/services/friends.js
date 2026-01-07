import { apiGet } from "./api";

export async function fetchFriends() {

  return apiGet("/friends");
}
