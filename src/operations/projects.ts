import { z } from "zod";
import { githubRequest } from "../common/utils.js";
import { GitHubIssueAssigneeSchema } from "../common/types.js";

// Schema definitions
export const ProjectSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string(),
  html_url: z.string(),
  columns_url: z.string(),
  owner_url: z.string(),
  name: z.string(),
  body: z.string().nullable(),
  number: z.number(),
  state: z.string(),
  creator: GitHubIssueAssigneeSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const ProjectColumnSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string(),
  project_url: z.string(),
  cards_url: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ProjectCardSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  url: z.string(),
  project_url: z.string(),
  column_url: z.string(),
  column_id: z.number(),
  note: z.string().nullable(),
  archived: z.boolean(),
  creator: GitHubIssueAssigneeSchema,
  created_at: z.string(),
  updated_at: z.string(),
  content_url: z.string().optional(),
});

// Input schemas
export const ListProjectsSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  state: z.enum(["open", "closed", "all"]).optional().describe("Filter projects by state"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number of the results"),
});

export const _ListProjectsSchema = ListProjectsSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const CreateProjectSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  name: z.string().describe("The name of the project"),
  body: z.string().optional().describe("The description of the project"),
});

export const _CreateProjectSchema = CreateProjectSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const ListProjectColumnsSchema = z.object({
  project_id: z.number().describe("The ID of the project"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number of the results"),
});

export const _ListProjectColumnsSchema = ListProjectColumnsSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const CreateProjectColumnSchema = z.object({
  project_id: z.number().describe("The ID of the project"),
  name: z.string().describe("The name of the column"),
});

export const _CreateProjectColumnSchema = CreateProjectColumnSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const CreateProjectCardSchema = z.object({
  column_id: z.number().describe("The ID of the column"),
  note: z.string().describe("The note content for the card"),
});

export const _CreateProjectCardSchema = CreateProjectCardSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

// Function implementations
export async function listProjects(
  github_pat: string,
  owner: string,
  repo: string,
  options: {
    state?: "open" | "closed" | "all";
    per_page?: number;
    page?: number;
  } = {}
): Promise<z.infer<typeof ProjectSchema>[]> {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/projects`);
  
  if (options.state) url.searchParams.append("state", options.state);
  if (options.per_page) url.searchParams.append("per_page", options.per_page.toString());
  if (options.page) url.searchParams.append("page", options.page.toString());
  
  const response = await githubRequest(
    github_pat,
    url.toString(),
    {
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    }
  );
  return z.array(ProjectSchema).parse(response);
}

export async function createProject(
  github_pat: string,
  owner: string,
  repo: string,
  name: string,
  body?: string
): Promise<z.infer<typeof ProjectSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/projects`,
    {
      method: "POST",
      body: {
        name,
        body,
      },
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    }
  );
  return ProjectSchema.parse(response);
}

export async function listProjectColumns(
  github_pat: string,
  project_id: number,
  options: {
    per_page?: number;
    page?: number;
  } = {}
): Promise<z.infer<typeof ProjectColumnSchema>[]> {
  const url = new URL(`https://api.github.com/projects/${project_id}/columns`);
  
  if (options.per_page) url.searchParams.append("per_page", options.per_page.toString());
  if (options.page) url.searchParams.append("page", options.page.toString());
  
  const response = await githubRequest(
    github_pat,
    url.toString(),
    {
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    }
  );
  return z.array(ProjectColumnSchema).parse(response);
}

export async function createProjectColumn(
  github_pat: string,
  project_id: number,
  name: string
): Promise<z.infer<typeof ProjectColumnSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/projects/${project_id}/columns`,
    {
      method: "POST",
      body: {
        name,
      },
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    }
  );
  return ProjectColumnSchema.parse(response);
}

export async function createProjectCard(
  github_pat: string,
  column_id: number,
  note: string
): Promise<z.infer<typeof ProjectCardSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/projects/columns/${column_id}/cards`,
    {
      method: "POST",
      body: {
        note,
      },
      headers: {
        "Accept": "application/vnd.github.inertia-preview+json",
      },
    }
  );
  return ProjectCardSchema.parse(response);
}
