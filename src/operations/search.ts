import { z } from "zod";
import { githubRequest, buildUrl } from "../common/utils.js";

export const SearchOptions = z.object({
  q: z.string(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.number().min(1).optional(),
  per_page: z.number().min(1).max(100).optional(),
});

export const SearchUsersOptions = SearchOptions.extend({
  sort: z.enum(["followers", "repositories", "joined"]).optional(),
});

export const SearchIssuesOptions = SearchOptions.extend({
  sort: z.enum([
    "comments",
    "reactions",
    "reactions-+1",
    "reactions--1",
    "reactions-smile",
    "reactions-thinking_face",
    "reactions-heart",
    "reactions-tada",
    "interactions",
    "created",
    "updated",
  ]).optional(),
});

export const SearchCodeSchema = SearchOptions;
export const SearchUsersSchema = SearchUsersOptions;
export const SearchIssuesSchema = SearchIssuesOptions;

export async function searchCode(github_pat: string, params: z.infer<typeof SearchCodeSchema>) {
  return githubRequest(github_pat, buildUrl("https://api.github.com/search/code", params));
}

export async function searchIssues(github_pat: string, params: z.infer<typeof SearchIssuesSchema>) {
  return githubRequest(github_pat, buildUrl("https://api.github.com/search/issues", params));
}

export async function searchUsers(github_pat: string, params: z.infer<typeof SearchUsersSchema>) {
  return githubRequest(github_pat, buildUrl("https://api.github.com/search/users", params));
}