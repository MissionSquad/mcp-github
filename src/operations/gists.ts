import { z } from "zod";
import { githubRequest } from "../common/utils.js";
import { GitHubIssueAssigneeSchema } from "../common/types.js";

// Schema definitions
export const GistFileSchema = z.record(
  z.object({
    filename: z.string().optional(),
    type: z.string().optional(),
    language: z.string().optional(),
    raw_url: z.string().optional(),
    size: z.number().optional(),
    truncated: z.boolean().optional(),
    content: z.string().optional(),
  })
);

export const GistSchema = z.object({
  url: z.string(),
  forks_url: z.string(),
  commits_url: z.string(),
  id: z.string(),
  node_id: z.string(),
  git_pull_url: z.string(),
  git_push_url: z.string(),
  html_url: z.string(),
  files: GistFileSchema,
  public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  description: z.string().nullable(),
  comments: z.number(),
  user: GitHubIssueAssigneeSchema.nullable(),
  comments_url: z.string(),
  owner: GitHubIssueAssigneeSchema.nullable(),
  truncated: z.boolean().optional(),
});

// Input schemas
export const CreateGistSchema = z.object({
  description: z.string().optional().describe("Description of the gist"),
  public: z.boolean().describe("Whether the gist is public"),
  files: z.record(
    z.object({
      content: z.string().describe("Content of the file"),
    })
  ).describe("Files that make up this gist. The key is the filename."),
});

export const _CreateGistSchema = CreateGistSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const ListGistsSchema = z.object({
  since: z.string().optional().describe("Only gists updated at or after this time are returned"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number of the results"),
});

export const _ListGistsSchema = ListGistsSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetGistSchema = z.object({
  gist_id: z.string().describe("The ID of the gist"),
});

export const _GetGistSchema = GetGistSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

// Function implementations
export async function createGist(
  github_pat: string,
  description: string | undefined,
  isPublic: boolean,
  files: Record<string, { content: string }>
): Promise<z.infer<typeof GistSchema>> {
  const response = await githubRequest(
    github_pat,
    "https://api.github.com/gists",
    {
      method: "POST",
      body: {
        description,
        public: isPublic,
        files,
      },
    }
  );
  return GistSchema.parse(response);
}

export async function listGists(
  github_pat: string,
  options: {
    since?: string;
    per_page?: number;
    page?: number;
  } = {}
): Promise<z.infer<typeof GistSchema>[]> {
  const url = new URL("https://api.github.com/gists");
  
  if (options.since) url.searchParams.append("since", options.since);
  if (options.per_page) url.searchParams.append("per_page", options.per_page.toString());
  if (options.page) url.searchParams.append("page", options.page.toString());
  
  const response = await githubRequest(github_pat, url.toString());
  return z.array(GistSchema).parse(response);
}

export async function getGist(
  github_pat: string,
  gist_id: string
): Promise<z.infer<typeof GistSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/gists/${gist_id}`
  );
  return GistSchema.parse(response);
}
