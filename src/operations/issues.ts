import { z } from "zod";
import { githubRequest, buildUrl } from "../common/utils.js";

export const GetIssueSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issue_number: z.number(),
});

export const _GetIssueSchema = GetIssueSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const IssueCommentSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issue_number: z.number(),
  body: z.string(),
});

export const _IssueCommentSchema = IssueCommentSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const CreateIssueOptionsSchema = z.object({
  title: z.string(),
  body: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  milestone: z.number().optional(),
  labels: z.array(z.string()).optional(),
});

export const CreateIssueSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  ...CreateIssueOptionsSchema.shape,
});

export const _CreateIssueSchema = CreateIssueSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const ListIssuesOptionsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  direction: z.enum(["asc", "desc"]).optional(),
  labels: z.array(z.string()).optional(),
  page: z.number().optional(),
  per_page: z.number().optional(),
  since: z.string().optional(),
  sort: z.enum(["created", "updated", "comments"]).optional(),
  state: z.enum(["open", "closed", "all"]).optional(),
});

export const _ListIssuesOptionsSchema = ListIssuesOptionsSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const UpdateIssueOptionsSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  issue_number: z.number(),
  title: z.string().optional(),
  body: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  milestone: z.number().optional(),
  labels: z.array(z.string()).optional(),
  state: z.enum(["open", "closed"]).optional(),
});

export const _UpdateIssueOptionsSchema = UpdateIssueOptionsSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export async function getIssue(github_pat: string, owner: string, repo: string, issue_number: number) {
  return githubRequest(github_pat, `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`);
}

export async function addIssueComment(
  github_pat: string,
  owner: string,
  repo: string,
  issue_number: number,
  body: string
) {
  return githubRequest(github_pat, `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}/comments`, {
    method: "POST",
    body: { body },
  });
}

export async function createIssue(
  github_pat: string,
  owner: string,
  repo: string,
  options: z.infer<typeof CreateIssueOptionsSchema>
) {
  return githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      body: options,
    }
  );
}

export async function listIssues(
  github_pat: string,
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof ListIssuesOptionsSchema>, "owner" | "repo">
) {
  const urlParams: Record<string, string | undefined> = {
    direction: options.direction,
    labels: options.labels?.join(","),
    page: options.page?.toString(),
    per_page: options.per_page?.toString(),
    since: options.since,
    sort: options.sort,
    state: options.state
  };

  return githubRequest(
    github_pat,
    buildUrl(`https://api.github.com/repos/${owner}/${repo}/issues`, urlParams)
  );
}

export async function updateIssue(
  github_pat: string,
  owner: string,
  repo: string,
  issue_number: number,
  options: Omit<z.infer<typeof UpdateIssueOptionsSchema>, "owner" | "repo" | "issue_number">
) {
  return githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`,
    {
      method: "PATCH",
      body: options,
    }
  );
}