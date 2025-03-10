import { z } from "zod";
import { githubRequest } from "../common/utils.js";
import { GitHubIssueAssigneeSchema } from "../common/types.js";

// Schema definitions
export const CommitStatusSchema = z.object({
  url: z.string(),
  id: z.number(),
  node_id: z.string(),
  state: z.enum(["error", "failure", "pending", "success"]),
  description: z.string().nullable(),
  target_url: z.string().nullable(),
  context: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  creator: GitHubIssueAssigneeSchema.nullable(),
});

// Input schemas
export const CreateCommitStatusSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  sha: z.string().describe("The SHA of the commit to create a status for"),
  state: z.enum(["error", "failure", "pending", "success"]).describe("The state of the status"),
  target_url: z.string().optional().describe("The target URL to associate with this status"),
  description: z.string().optional().describe("A short description of the status"),
  context: z.string().optional().describe("A string label to differentiate this status from others")
});

export const _CreateCommitStatusSchema = CreateCommitStatusSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetCommitStatusesSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  ref: z.string().describe("The ref (SHA, branch name, or tag name) to get statuses for")
});

export const _GetCommitStatusesSchema = GetCommitStatusesSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetCombinedStatusSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  ref: z.string().describe("The ref (SHA, branch name, or tag name) to get the combined status for")
});

export const _GetCombinedStatusSchema = GetCombinedStatusSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

// Function implementations
export async function createCommitStatus(
  github_pat: string,
  owner: string,
  repo: string,
  sha: string,
  state: "error" | "failure" | "pending" | "success",
  options: {
    target_url?: string;
    description?: string;
    context?: string;
  } = {}
): Promise<z.infer<typeof CommitStatusSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/statuses/${sha}`,
    {
      method: "POST",
      body: {
        state,
        ...options,
      },
    }
  );
  return CommitStatusSchema.parse(response);
}

export async function getCommitStatuses(
  github_pat: string,
  owner: string,
  repo: string,
  ref: string
): Promise<z.infer<typeof CommitStatusSchema>[]> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/commits/${ref}/statuses`
  );
  return z.array(CommitStatusSchema).parse(response);
}

export const CombinedStatusResponseSchema = z.object({
  state: z.string(),
  statuses: z.array(CommitStatusSchema),
  sha: z.string(),
  total_count: z.number(),
  repository: z.object({
    id: z.number(),
    name: z.string(),
    full_name: z.string(),
    owner: z.any(),
  }),
});

export async function getCombinedStatus(
  github_pat: string,
  owner: string,
  repo: string,
  ref: string
): Promise<z.infer<typeof CombinedStatusResponseSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/commits/${ref}/status`
  );
  
  return CombinedStatusResponseSchema.parse(response);
}
