import { z } from "zod";
import { githubRequest } from "../common/utils.js";
import { GitHubReferenceSchema } from "../common/types.js";

// Schema definitions
export const CreateBranchOptionsSchema = z.object({
  ref: z.string(),
  sha: z.string(),
});

export const CreateBranchSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
  branch: z.string().describe("Name for the new branch"),
  from_branch: z.string().optional().describe("Optional: source branch to create from (defaults to the repository's default branch)"),
});

// Type exports
export type CreateBranchOptions = z.infer<typeof CreateBranchOptionsSchema>;

// Function implementations
export async function getDefaultBranchSHA(github_pat: string, owner: string, repo: string): Promise<string> {
  try {
    const response = await githubRequest(
      github_pat,
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`
    );
    const data = GitHubReferenceSchema.parse(response);
    return data.object.sha;
  } catch (error) {
    const masterResponse = await githubRequest(
      github_pat,
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/master`
    );
    if (!masterResponse) {
      throw new Error("Could not find default branch (tried 'main' and 'master')");
    }
    const data = GitHubReferenceSchema.parse(masterResponse);
    return data.object.sha;
  }
}

export async function createBranch(
  github_pat: string,
  owner: string,
  repo: string,
  options: CreateBranchOptions
): Promise<z.infer<typeof GitHubReferenceSchema>> {
  const fullRef = `refs/heads/${options.ref}`;

  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      body: {
        ref: fullRef,
        sha: options.sha,
      },
    }
  );

  return GitHubReferenceSchema.parse(response);
}

export async function getBranchSHA(
  github_pat: string,
  owner: string,
  repo: string,
  branch: string
): Promise<string> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`
  );

  const data = GitHubReferenceSchema.parse(response);
  return data.object.sha;
}

export async function createBranchFromRef(
  github_pat: string,
  owner: string,
  repo: string,
  newBranch: string,
  fromBranch?: string
): Promise<z.infer<typeof GitHubReferenceSchema>> {
  let sha: string;
  if (fromBranch) {
    sha = await getBranchSHA(github_pat, owner, repo, fromBranch);
  } else {
    sha = await getDefaultBranchSHA(github_pat, owner, repo);
  }

  return createBranch(github_pat, owner, repo, {
    ref: newBranch,
    sha,
  });
}

export async function updateBranch(
  github_pat: string,
  owner: string,
  repo: string,
  branch: string,
  sha: string
): Promise<z.infer<typeof GitHubReferenceSchema>> {
  const response = await githubRequest(
    github_pat,
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      method: "PATCH",
      body: {
        sha,
        force: true,
      },
    }
  );

  return GitHubReferenceSchema.parse(response);
}
