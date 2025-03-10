import { z } from "zod";
import { githubRequest } from "../common/utils.js";
import { GitHubIssueAssigneeSchema } from "../common/types.js";

// Schema definitions
export const PackageVersionSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  package_html_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  html_url: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const PackageSchema = z.object({
  id: z.number(),
  name: z.string(),
  package_type: z.string(),
  owner: GitHubIssueAssigneeSchema.optional(),
  version_count: z.number(),
  visibility: z.string(),
  url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  html_url: z.string(),
  versions_url: z.string(),
  repository_url: z.string().optional(),
});

// Input schemas
export const ListOrgPackagesSchema = z.object({
  org: z.string().describe("Organization name"),
  package_type: z.enum(["npm", "maven", "rubygems", "docker", "nuget", "container"]).optional().describe("The type of package to filter for"),
  visibility: z.enum(["public", "private", "internal"]).optional().describe("The visibility to filter for"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number of the results"),
});

export const _ListOrgPackagesSchema = ListOrgPackagesSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const ListUserPackagesSchema = z.object({
  username: z.string().describe("Username"),
  package_type: z.enum(["npm", "maven", "rubygems", "docker", "nuget", "container"]).optional().describe("The type of package to filter for"),
  visibility: z.enum(["public", "private", "internal"]).optional().describe("The visibility to filter for"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number of the results"),
});

export const _ListUserPackagesSchema = ListUserPackagesSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const ListRepoPackagesSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  package_type: z.enum(["npm", "maven", "rubygems", "docker", "nuget", "container"]).optional().describe("The type of package to filter for"),
  per_page: z.number().optional().describe("Results per page (max 100)"),
  page: z.number().optional().describe("Page number of the results"),
});

export const _ListRepoPackagesSchema = ListRepoPackagesSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetOrgPackageSchema = z.object({
  org: z.string().describe("Organization name"),
  package_type: z.enum(["npm", "maven", "rubygems", "docker", "nuget", "container"]).describe("The type of package"),
  package_name: z.string().describe("The name of the package"),
});

export const _GetOrgPackageSchema = GetOrgPackageSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetUserPackageSchema = z.object({
  username: z.string().describe("Username"),
  package_type: z.enum(["npm", "maven", "rubygems", "docker", "nuget", "container"]).describe("The type of package"),
  package_name: z.string().describe("The name of the package"),
});

export const _GetUserPackageSchema = GetUserPackageSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetRepoPackageSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  package_type: z.enum(["npm", "maven", "rubygems", "docker", "nuget", "container"]).describe("The type of package"),
  package_name: z.string().describe("The name of the package"),
});

export const _GetRepoPackageSchema = GetRepoPackageSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

// Function implementations
export async function listOrgPackages(
  github_pat: string,
  org: string,
  options: {
    package_type?: "npm" | "maven" | "rubygems" | "docker" | "nuget" | "container";
    visibility?: "public" | "private" | "internal";
    per_page?: number;
    page?: number;
  } = {}
): Promise<z.infer<typeof PackageSchema>[]> {
  const url = new URL(`https://api.github.com/orgs/${org}/packages`);
  
  if (options.package_type) url.searchParams.append("package_type", options.package_type);
  if (options.visibility) url.searchParams.append("visibility", options.visibility);
  if (options.per_page) url.searchParams.append("per_page", options.per_page.toString());
  if (options.page) url.searchParams.append("page", options.page.toString());
  
  const response = await githubRequest(github_pat, url.toString());
  return z.array(PackageSchema).parse(response);
}

export async function listUserPackages(
  github_pat: string,
  username: string,
  options: {
    package_type?: "npm" | "maven" | "rubygems" | "docker" | "nuget" | "container";
    visibility?: "public" | "private" | "internal";
    per_page?: number;
    page?: number;
  } = {}
): Promise<z.infer<typeof PackageSchema>[]> {
  const url = new URL(`https://api.github.com/users/${username}/packages`);
  
  if (options.package_type) url.searchParams.append("package_type", options.package_type);
  if (options.visibility) url.searchParams.append("visibility", options.visibility);
  if (options.per_page) url.searchParams.append("per_page", options.per_page.toString());
  if (options.page) url.searchParams.append("page", options.page.toString());
  
  const response = await githubRequest(github_pat, url.toString());
  return z.array(PackageSchema).parse(response);
}

export async function listRepoPackages(
  github_pat: string,
  owner: string,
  repo: string,
  options: {
    package_type?: "npm" | "maven" | "rubygems" | "docker" | "nuget" | "container";
    per_page?: number;
    page?: number;
  } = {}
): Promise<z.infer<typeof PackageSchema>[]> {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/packages`);
  
  if (options.package_type) url.searchParams.append("package_type", options.package_type);
  if (options.per_page) url.searchParams.append("per_page", options.per_page.toString());
  if (options.page) url.searchParams.append("page", options.page.toString());
  
  const response = await githubRequest(github_pat, url.toString());
  return z.array(PackageSchema).parse(response);
}

export async function getOrgPackage(
  github_pat: string,
  org: string,
  package_type: "npm" | "maven" | "rubygems" | "docker" | "nuget" | "container",
  package_name: string
): Promise<z.infer<typeof PackageSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/orgs/${org}/packages/${package_type}/${package_name}`
  );
  return PackageSchema.parse(response);
}

export async function getUserPackage(
  github_pat: string,
  username: string,
  package_type: "npm" | "maven" | "rubygems" | "docker" | "nuget" | "container",
  package_name: string
): Promise<z.infer<typeof PackageSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/users/${username}/packages/${package_type}/${package_name}`
  );
  return PackageSchema.parse(response);
}

export async function getRepoPackage(
  github_pat: string,
  owner: string,
  repo: string,
  package_type: "npm" | "maven" | "rubygems" | "docker" | "nuget" | "container",
  package_name: string
): Promise<z.infer<typeof PackageSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/packages/${package_type}/${package_name}`
  );
  return PackageSchema.parse(response);
}
