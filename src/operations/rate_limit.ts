import { z } from "zod";
import { githubRequest } from "../common/utils.js";

// Schema definitions
export const RateLimitResourceSchema = z.object({
  limit: z.number(),
  used: z.number(),
  remaining: z.number(),
  reset: z.number(),
});

export const RateLimitSchema = z.object({
  resources: z.object({
    core: RateLimitResourceSchema,
    search: RateLimitResourceSchema,
    graphql: RateLimitResourceSchema,
    integration_manifest: RateLimitResourceSchema,
    code_scanning_upload: RateLimitResourceSchema,
    actions_runner_registration: RateLimitResourceSchema,
    scim: RateLimitResourceSchema,
    dependency_snapshots: RateLimitResourceSchema,
  }),
  rate: RateLimitResourceSchema,
});

// Input schemas
export const GetRateLimitSchema = z.object({});

export const _GetRateLimitSchema = GetRateLimitSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

// Function implementations
export async function getRateLimit(
  github_pat: string
): Promise<z.infer<typeof RateLimitSchema>> {
  const response = await githubRequest(
    github_pat,
    "https://api.github.com/rate_limit"
  );
  return RateLimitSchema.parse(response);
}
