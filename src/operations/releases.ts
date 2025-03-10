import { z } from "zod";
import { githubRequest } from "../common/utils.js";
import { GitHubIssueAssigneeSchema, GitHubRepositorySchema } from "../common/types.js";

// Schema definitions
export const ReleaseAssetSchema = z.object({
  url: z.string(),
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  label: z.string().nullable(),
  content_type: z.string(),
  state: z.string(),
  size: z.number(),
  download_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  browser_download_url: z.string(),
  uploader: GitHubIssueAssigneeSchema.nullable(),
});

export const ReleaseSchema = z.object({
  url: z.string(),
  assets_url: z.string(),
  upload_url: z.string(),
  html_url: z.string(),
  id: z.number(),
  node_id: z.string(),
  tag_name: z.string(),
  target_commitish: z.string(),
  name: z.string().nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  created_at: z.string(),
  published_at: z.string().nullable(),
  assets: z.array(ReleaseAssetSchema),
  tarball_url: z.string().nullable(),
  zipball_url: z.string().nullable(),
  body: z.string().nullable(),
  author: GitHubIssueAssigneeSchema,
});

export const TagSchema = z.object({
  ref: z.string(),
  node_id: z.string(),
  url: z.string(),
  object: z.object({
    sha: z.string(),
    type: z.string(),
    url: z.string(),
  }),
});

// Input schemas
export const CreateReleaseSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  tag_name: z.string().describe("The name of the tag"),
  target_commitish: z.string().optional().describe("Specifies the commitish value that determines where the Git tag is created from"),
  name: z.string().optional().describe("The name of the release"),
  body: z.string().optional().describe("Text describing the release"),
  draft: z.boolean().optional().describe("true to create a draft (unpublished) release, false to create a published one"),
  prerelease: z.boolean().optional().describe("true to identify the release as a prerelease, false to identify it as a full release"),
  generate_release_notes: z.boolean().optional().describe("Whether to automatically generate the name and body for this release")
});

export const _CreateReleaseSchema = CreateReleaseSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const ListReleasesSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number of the results")
});

export const _ListReleasesSchema = ListReleasesSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const DeleteReleaseSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  release_id: z.number().describe("The ID of the release")
});

export const _DeleteReleaseSchema = DeleteReleaseSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetReleaseAssetSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  asset_id: z.number().describe("The ID of the asset")
});

export const _GetReleaseAssetSchema = GetReleaseAssetSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const UploadReleaseAssetSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  release_id: z.number().describe("The ID of the release"),
  name: z.string().describe("The name of the asset"),
  label: z.string().optional().describe("An alternate short description of the asset"),
  content: z.string().describe("The content of the asset (base64 encoded)"),
  content_type: z.string().describe("The content type of the asset")
});

export const _UploadReleaseAssetSchema = UploadReleaseAssetSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const CreateTagSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  ref: z.string().describe("The name of the fully qualified reference (e.g., refs/tags/v1.0.0)"),
  sha: z.string().describe("The SHA1 value to set this reference to")
});

export const _CreateTagSchema = CreateTagSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

// Function implementations
export async function createRelease(
  github_pat: string,
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof CreateReleaseSchema>, "owner" | "repo" | "github_pat">
): Promise<z.infer<typeof ReleaseSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/releases`,
    {
      method: "POST",
      body: options,
    }
  );
  return ReleaseSchema.parse(response);
}

export async function listReleases(
  github_pat: string,
  owner: string,
  repo: string,
  options: { per_page?: number; page?: number } = {}
): Promise<z.infer<typeof ReleaseSchema>[]> {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/releases`);
  
  if (options.per_page) url.searchParams.append("per_page", options.per_page.toString());
  if (options.page) url.searchParams.append("page", options.page.toString());
  
  const response = await githubRequest(github_pat, url.toString());
  return z.array(ReleaseSchema).parse(response);
}

export async function deleteRelease(
  github_pat: string,
  owner: string,
  repo: string,
  release_id: number
): Promise<void> {
  await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/releases/${release_id}`,
    {
      method: "DELETE",
    }
  );
}

export async function getReleaseAsset(
  github_pat: string,
  owner: string,
  repo: string,
  asset_id: number
): Promise<z.infer<typeof ReleaseAssetSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset_id}`
  );
  return ReleaseAssetSchema.parse(response);
}

export async function uploadReleaseAsset(
  github_pat: string,
  owner: string,
  repo: string,
  release_id: number,
  name: string,
  content: string,
  content_type: string,
  label?: string
): Promise<z.infer<typeof ReleaseAssetSchema>> {
  // Get the release to get the upload_url
  const release = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/releases/${release_id}`
  );
  
  const uploadUrl = (release as any).upload_url.replace(
    "{?name,label}",
    ""
  );
  
  const url = new URL(uploadUrl);
  url.searchParams.append("name", name);
  if (label) url.searchParams.append("label", label);
  
  const response = await githubRequest(
    github_pat,
    url.toString(),
    {
      method: "POST",
      body: Buffer.from(content, "base64").toString(),
      headers: {
        "Content-Type": content_type,
      },
    }
  );
  
  return ReleaseAssetSchema.parse(response);
}

export async function createTag(
  github_pat: string,
  owner: string,
  repo: string,
  ref: string,
  sha: string
): Promise<z.infer<typeof TagSchema>> {
  // Ensure the ref is properly formatted
  const formattedRef = ref.startsWith("refs/") ? ref : `refs/tags/${ref}`;
  
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      body: {
        ref: formattedRef,
        sha,
      },
    }
  );
  
  return TagSchema.parse(response);
}
