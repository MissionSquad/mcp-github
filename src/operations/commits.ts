import { z } from "zod";
import { githubRequest, buildUrl } from "../common/utils.js";

export const ListCommitsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  sha: z.string().optional(),
  page: z.number().optional(),
  perPage: z.number().optional()
});

export async function listCommits(
  github_pat: string,
  owner: string,
  repo: string,
  page?: number,
  perPage?: number,
  sha?: string
) {
  return githubRequest(
    github_pat,
    buildUrl(`https://api.github.com/repos/${owner}/${repo}/commits`, {
      page: page?.toString(),
      per_page: perPage?.toString(),
      sha
    })
  );
}