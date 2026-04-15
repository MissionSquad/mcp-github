import { z } from "zod";
import { buildUrl, githubWebhookRequest } from "../common/utils.js";
import {
  GitHubWebhookConfigSchema,
  GitHubWebhookDeliveryDetailSchema,
  GitHubWebhookDeliverySchema,
  GitHubWebhookSchema,
} from "../common/types.js";

const WebhookContentTypeSchema = z.enum(["json", "form"]);
const WebhookInsecureSslSchema = z.union([z.literal("0"), z.literal("1"), z.literal(0), z.literal(1)]);

function hasDefinedValues(value: Record<string, unknown>): boolean {
  return Object.values(value).some((entry) => entry !== undefined);
}

const RepositoryWebhookConfigInputSchema = z.object({
  url: z.string().url().describe("The URL to which the payloads will be delivered"),
  content_type: WebhookContentTypeSchema.optional().describe("The media type used to serialize the payloads"),
  secret: z.string().optional().describe("The secret used to sign webhook deliveries"),
  insecure_ssl: WebhookInsecureSslSchema.optional().describe("Set to 1 to disable SSL verification; 0 keeps verification enabled"),
});

const RepositoryWebhookConfigUpdateFieldsSchema = z.object({
  url: z.string().url().optional().describe("The URL to which the payloads will be delivered"),
  content_type: WebhookContentTypeSchema.optional().describe("The media type used to serialize the payloads"),
  secret: z.string().optional().describe("The secret used to sign webhook deliveries"),
  insecure_ssl: WebhookInsecureSslSchema.optional().describe("Set to 1 to disable SSL verification; 0 keeps verification enabled"),
});

const RepositoryWebhookConfigUpdateInputSchema = RepositoryWebhookConfigUpdateFieldsSchema.refine((value) => hasDefinedValues(value), {
  message: "At least one webhook config field must be provided",
});

const OrganizationWebhookConfigInputSchema = RepositoryWebhookConfigInputSchema.extend({
  username: z.string().optional().describe("Optional username for basic authentication"),
  password: z.string().optional().describe("Optional password for basic authentication"),
});

const OrganizationWebhookConfigUpdateFieldsSchema = RepositoryWebhookConfigUpdateFieldsSchema.extend({
  username: z.string().optional().describe("Optional username for basic authentication"),
  password: z.string().optional().describe("Optional password for basic authentication"),
});

const OrganizationWebhookConfigUpdateInputSchema = OrganizationWebhookConfigUpdateFieldsSchema.refine((value) => hasDefinedValues(value), {
  message: "At least one webhook config field must be provided",
});

const RepositoryRefSchema = z.object({
  owner: z.string().describe("Repository owner (username or organization)"),
  repo: z.string().describe("Repository name"),
});

const OrganizationRefSchema = z.object({
  org: z.string().describe("Organization name"),
});

const PaginationSchema = z.object({
  page: z.number().optional().describe("Page number for pagination"),
  per_page: z.number().optional().describe("Number of results per page (max 100)"),
});

const DeliveryListSchema = z.object({
  per_page: z.number().optional().describe("Number of results per page (max 100)"),
  cursor: z.string().optional().describe("Cursor for delivery pagination"),
  status: z.enum(["success", "failure"]).optional().describe("Filter deliveries by outcome classification"),
});

const HookIdSchema = z.object({
  hook_id: z.number().describe("Webhook identifier"),
});

const DeliveryIdSchema = z.object({
  delivery_id: z.number().describe("Webhook delivery identifier"),
});

export const ListRepositoryWebhooksSchema = RepositoryRefSchema.extend(PaginationSchema.shape);
export const _ListRepositoryWebhooksSchema = ListRepositoryWebhooksSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetRepositoryWebhookSchema = RepositoryRefSchema.extend(HookIdSchema.shape);
export const _GetRepositoryWebhookSchema = GetRepositoryWebhookSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const CreateRepositoryWebhookSchema = RepositoryRefSchema.extend({
  events: z.array(z.string()).min(1).describe("Events that should trigger this webhook; use [\"*\"] for all events"),
  active: z.boolean().optional().describe("Whether the webhook is active"),
  config: RepositoryWebhookConfigInputSchema,
});
export const _CreateRepositoryWebhookSchema = CreateRepositoryWebhookSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

const UpdateRepositoryWebhookFieldsSchema = RepositoryRefSchema.extend(HookIdSchema.shape).extend({
  active: z.boolean().optional().describe("Whether the webhook is active"),
  events: z.array(z.string()).min(1).optional().describe("Replace the webhook event subscriptions"),
  add_events: z.array(z.string()).min(1).optional().describe("Append event subscriptions without replacing existing ones"),
  remove_events: z.array(z.string()).min(1).optional().describe("Remove specific event subscriptions"),
  config: RepositoryWebhookConfigUpdateInputSchema.optional(),
});

export const UpdateRepositoryWebhookSchema = UpdateRepositoryWebhookFieldsSchema.refine((value) => {
  const { active, events, add_events, remove_events, config } = value;
  return active !== undefined || events !== undefined || add_events !== undefined || remove_events !== undefined || config !== undefined;
}, {
  message: "At least one repository webhook field must be provided",
});
export const _UpdateRepositoryWebhookSchema = UpdateRepositoryWebhookFieldsSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
}).refine((value) => {
  const { active, events, add_events, remove_events, config } = value;
  return active !== undefined || events !== undefined || add_events !== undefined || remove_events !== undefined || config !== undefined;
}, {
  message: "At least one repository webhook field must be provided",
});

export const DeleteRepositoryWebhookSchema = RepositoryRefSchema.extend(HookIdSchema.shape);
export const _DeleteRepositoryWebhookSchema = DeleteRepositoryWebhookSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetRepositoryWebhookConfigSchema = RepositoryRefSchema.extend(HookIdSchema.shape);
export const _GetRepositoryWebhookConfigSchema = GetRepositoryWebhookConfigSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

const UpdateRepositoryWebhookConfigFieldsSchema = RepositoryRefSchema.extend(HookIdSchema.shape).extend(
  RepositoryWebhookConfigUpdateFieldsSchema.shape
);

export const UpdateRepositoryWebhookConfigSchema = UpdateRepositoryWebhookConfigFieldsSchema.refine((value) => {
  const { url, content_type, secret, insecure_ssl } = value;
  return hasDefinedValues({ url, content_type, secret, insecure_ssl });
}, {
  message: "At least one repository webhook config field must be provided",
});
export const _UpdateRepositoryWebhookConfigSchema = UpdateRepositoryWebhookConfigFieldsSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
}).refine((value) => {
  const { url, content_type, secret, insecure_ssl } = value;
  return hasDefinedValues({ url, content_type, secret, insecure_ssl });
}, {
  message: "At least one repository webhook config field must be provided",
});

export const PingRepositoryWebhookSchema = RepositoryRefSchema.extend(HookIdSchema.shape);
export const _PingRepositoryWebhookSchema = PingRepositoryWebhookSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const ListRepositoryWebhookDeliveriesSchema = RepositoryRefSchema.extend(HookIdSchema.shape).extend(DeliveryListSchema.shape);
export const _ListRepositoryWebhookDeliveriesSchema = ListRepositoryWebhookDeliveriesSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetRepositoryWebhookDeliverySchema = RepositoryRefSchema.extend(HookIdSchema.shape).extend(DeliveryIdSchema.shape);
export const _GetRepositoryWebhookDeliverySchema = GetRepositoryWebhookDeliverySchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const RedeliverRepositoryWebhookDeliverySchema = RepositoryRefSchema.extend(HookIdSchema.shape).extend(DeliveryIdSchema.shape);
export const _RedeliverRepositoryWebhookDeliverySchema = RedeliverRepositoryWebhookDeliverySchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const ListOrganizationWebhooksSchema = OrganizationRefSchema.extend(PaginationSchema.shape);
export const _ListOrganizationWebhooksSchema = ListOrganizationWebhooksSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetOrganizationWebhookSchema = OrganizationRefSchema.extend(HookIdSchema.shape);
export const _GetOrganizationWebhookSchema = GetOrganizationWebhookSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const CreateOrganizationWebhookSchema = OrganizationRefSchema.extend({
  events: z.array(z.string()).min(1).describe("Events that should trigger this webhook; use [\"*\"] for all events"),
  active: z.boolean().optional().describe("Whether the webhook is active"),
  config: OrganizationWebhookConfigInputSchema,
});
export const _CreateOrganizationWebhookSchema = CreateOrganizationWebhookSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

const UpdateOrganizationWebhookFieldsSchema = OrganizationRefSchema.extend(HookIdSchema.shape).extend({
  active: z.boolean().optional().describe("Whether the webhook is active"),
  events: z.array(z.string()).min(1).optional().describe("Replace the webhook event subscriptions"),
  config: OrganizationWebhookConfigUpdateInputSchema.optional(),
});

export const UpdateOrganizationWebhookSchema = UpdateOrganizationWebhookFieldsSchema.refine((value) => {
  const { active, events, config } = value;
  return active !== undefined || events !== undefined || config !== undefined;
}, {
  message: "At least one organization webhook field must be provided",
});
export const _UpdateOrganizationWebhookSchema = UpdateOrganizationWebhookFieldsSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
}).refine((value) => {
  const { active, events, config } = value;
  return active !== undefined || events !== undefined || config !== undefined;
}, {
  message: "At least one organization webhook field must be provided",
});

export const DeleteOrganizationWebhookSchema = OrganizationRefSchema.extend(HookIdSchema.shape);
export const _DeleteOrganizationWebhookSchema = DeleteOrganizationWebhookSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetOrganizationWebhookConfigSchema = OrganizationRefSchema.extend(HookIdSchema.shape);
export const _GetOrganizationWebhookConfigSchema = GetOrganizationWebhookConfigSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

const UpdateOrganizationWebhookConfigFieldsSchema = OrganizationRefSchema.extend(HookIdSchema.shape).extend(
  OrganizationWebhookConfigUpdateFieldsSchema.shape
);

export const UpdateOrganizationWebhookConfigSchema = UpdateOrganizationWebhookConfigFieldsSchema.refine((value) => {
  const { url, content_type, secret, insecure_ssl, username, password } = value;
  return hasDefinedValues({ url, content_type, secret, insecure_ssl, username, password });
}, {
  message: "At least one organization webhook config field must be provided",
});
export const _UpdateOrganizationWebhookConfigSchema = UpdateOrganizationWebhookConfigFieldsSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
}).refine((value) => {
  const { url, content_type, secret, insecure_ssl, username, password } = value;
  return hasDefinedValues({ url, content_type, secret, insecure_ssl, username, password });
}, {
  message: "At least one organization webhook config field must be provided",
});

export const PingOrganizationWebhookSchema = OrganizationRefSchema.extend(HookIdSchema.shape);
export const _PingOrganizationWebhookSchema = PingOrganizationWebhookSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const ListOrganizationWebhookDeliveriesSchema = OrganizationRefSchema.extend(HookIdSchema.shape).extend(DeliveryListSchema.shape);
export const _ListOrganizationWebhookDeliveriesSchema = ListOrganizationWebhookDeliveriesSchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const GetOrganizationWebhookDeliverySchema = OrganizationRefSchema.extend(HookIdSchema.shape).extend(DeliveryIdSchema.shape);
export const _GetOrganizationWebhookDeliverySchema = GetOrganizationWebhookDeliverySchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

export const RedeliverOrganizationWebhookDeliverySchema = OrganizationRefSchema.extend(HookIdSchema.shape).extend(DeliveryIdSchema.shape);
export const _RedeliverOrganizationWebhookDeliverySchema = RedeliverOrganizationWebhookDeliverySchema.extend({
  github_pat: z.string().describe("GitHub Personal Access Token"),
});

function repositoryWebhookUrl(owner: string, repo: string, suffix = ""): string {
  return `https://api.github.com/repos/${owner}/${repo}/hooks${suffix}`;
}

function organizationWebhookUrl(org: string, suffix = ""): string {
  return `https://api.github.com/orgs/${org}/hooks${suffix}`;
}

export async function listRepositoryWebhooks(
  github_pat: string,
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof ListRepositoryWebhooksSchema>, "owner" | "repo">
) {
  const response = await githubWebhookRequest(
    github_pat,
    buildUrl(repositoryWebhookUrl(owner, repo), options)
  );
  return z.array(GitHubWebhookSchema).parse(response);
}

export async function getRepositoryWebhook(github_pat: string, owner: string, repo: string, hook_id: number) {
  const response = await githubWebhookRequest(github_pat, repositoryWebhookUrl(owner, repo, `/${hook_id}`));
  return GitHubWebhookSchema.parse(response);
}

export async function createRepositoryWebhook(
  github_pat: string,
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof CreateRepositoryWebhookSchema>, "owner" | "repo">
) {
  const response = await githubWebhookRequest(github_pat, repositoryWebhookUrl(owner, repo), {
    method: "POST",
    body: {
      name: "web",
      ...options,
    },
  });
  return GitHubWebhookSchema.parse(response);
}

export async function updateRepositoryWebhook(
  github_pat: string,
  owner: string,
  repo: string,
  hook_id: number,
  options: Omit<z.infer<typeof UpdateRepositoryWebhookSchema>, "owner" | "repo" | "hook_id">
) {
  const response = await githubWebhookRequest(github_pat, repositoryWebhookUrl(owner, repo, `/${hook_id}`), {
    method: "PATCH",
    body: {
      name: "web",
      ...options,
    },
  });
  return GitHubWebhookSchema.parse(response);
}

export async function deleteRepositoryWebhook(github_pat: string, owner: string, repo: string, hook_id: number) {
  return githubWebhookRequest(github_pat, repositoryWebhookUrl(owner, repo, `/${hook_id}`), {
    method: "DELETE",
  });
}

export async function getRepositoryWebhookConfig(github_pat: string, owner: string, repo: string, hook_id: number) {
  const response = await githubWebhookRequest(github_pat, repositoryWebhookUrl(owner, repo, `/${hook_id}/config`));
  return GitHubWebhookConfigSchema.parse(response);
}

export async function updateRepositoryWebhookConfig(
  github_pat: string,
  owner: string,
  repo: string,
  hook_id: number,
  options: Omit<z.infer<typeof UpdateRepositoryWebhookConfigSchema>, "owner" | "repo" | "hook_id">
) {
  const response = await githubWebhookRequest(github_pat, repositoryWebhookUrl(owner, repo, `/${hook_id}/config`), {
    method: "PUT",
    body: options,
  });
  return GitHubWebhookConfigSchema.parse(response);
}

export async function pingRepositoryWebhook(github_pat: string, owner: string, repo: string, hook_id: number) {
  return githubWebhookRequest(github_pat, repositoryWebhookUrl(owner, repo, `/${hook_id}/pings`), {
    method: "POST",
  });
}

export async function listRepositoryWebhookDeliveries(
  github_pat: string,
  owner: string,
  repo: string,
  hook_id: number,
  options: Omit<z.infer<typeof ListRepositoryWebhookDeliveriesSchema>, "owner" | "repo" | "hook_id">
) {
  const response = await githubWebhookRequest(
    github_pat,
    buildUrl(repositoryWebhookUrl(owner, repo, `/${hook_id}/deliveries`), options)
  );
  return z.array(GitHubWebhookDeliverySchema).parse(response);
}

export async function getRepositoryWebhookDelivery(
  github_pat: string,
  owner: string,
  repo: string,
  hook_id: number,
  delivery_id: number
) {
  const response = await githubWebhookRequest(
    github_pat,
    repositoryWebhookUrl(owner, repo, `/${hook_id}/deliveries/${delivery_id}`)
  );
  return GitHubWebhookDeliveryDetailSchema.parse(response);
}

export async function redeliverRepositoryWebhookDelivery(
  github_pat: string,
  owner: string,
  repo: string,
  hook_id: number,
  delivery_id: number
) {
  return githubWebhookRequest(
    github_pat,
    repositoryWebhookUrl(owner, repo, `/${hook_id}/deliveries/${delivery_id}/attempts`),
    { method: "POST" }
  );
}

export async function listOrganizationWebhooks(
  github_pat: string,
  org: string,
  options: Omit<z.infer<typeof ListOrganizationWebhooksSchema>, "org">
) {
  const response = await githubWebhookRequest(
    github_pat,
    buildUrl(organizationWebhookUrl(org), options)
  );
  return z.array(GitHubWebhookSchema).parse(response);
}

export async function getOrganizationWebhook(github_pat: string, org: string, hook_id: number) {
  const response = await githubWebhookRequest(github_pat, organizationWebhookUrl(org, `/${hook_id}`));
  return GitHubWebhookSchema.parse(response);
}

export async function createOrganizationWebhook(
  github_pat: string,
  org: string,
  options: Omit<z.infer<typeof CreateOrganizationWebhookSchema>, "org">
) {
  const response = await githubWebhookRequest(github_pat, organizationWebhookUrl(org), {
    method: "POST",
    body: {
      name: "web",
      ...options,
    },
  });
  return GitHubWebhookSchema.parse(response);
}

export async function updateOrganizationWebhook(
  github_pat: string,
  org: string,
  hook_id: number,
  options: Omit<z.infer<typeof UpdateOrganizationWebhookSchema>, "org" | "hook_id">
) {
  const response = await githubWebhookRequest(github_pat, organizationWebhookUrl(org, `/${hook_id}`), {
    method: "PATCH",
    body: {
      name: "web",
      ...options,
    },
  });
  return GitHubWebhookSchema.parse(response);
}

export async function deleteOrganizationWebhook(github_pat: string, org: string, hook_id: number) {
  return githubWebhookRequest(github_pat, organizationWebhookUrl(org, `/${hook_id}`), {
    method: "DELETE",
  });
}

export async function getOrganizationWebhookConfig(github_pat: string, org: string, hook_id: number) {
  const response = await githubWebhookRequest(github_pat, organizationWebhookUrl(org, `/${hook_id}/config`));
  return GitHubWebhookConfigSchema.parse(response);
}

export async function updateOrganizationWebhookConfig(
  github_pat: string,
  org: string,
  hook_id: number,
  options: Omit<z.infer<typeof UpdateOrganizationWebhookConfigSchema>, "org" | "hook_id">
) {
  const response = await githubWebhookRequest(github_pat, organizationWebhookUrl(org, `/${hook_id}/config`), {
    method: "PATCH",
    body: options,
  });
  return GitHubWebhookConfigSchema.parse(response);
}

export async function pingOrganizationWebhook(github_pat: string, org: string, hook_id: number) {
  return githubWebhookRequest(github_pat, organizationWebhookUrl(org, `/${hook_id}/pings`), {
    method: "POST",
  });
}

export async function listOrganizationWebhookDeliveries(
  github_pat: string,
  org: string,
  hook_id: number,
  options: Omit<z.infer<typeof ListOrganizationWebhookDeliveriesSchema>, "org" | "hook_id">
) {
  const response = await githubWebhookRequest(
    github_pat,
    buildUrl(organizationWebhookUrl(org, `/${hook_id}/deliveries`), options)
  );
  return z.array(GitHubWebhookDeliverySchema).parse(response);
}

export async function getOrganizationWebhookDelivery(
  github_pat: string,
  org: string,
  hook_id: number,
  delivery_id: number
) {
  const response = await githubWebhookRequest(
    github_pat,
    organizationWebhookUrl(org, `/${hook_id}/deliveries/${delivery_id}`)
  );
  return GitHubWebhookDeliveryDetailSchema.parse(response);
}

export async function redeliverOrganizationWebhookDelivery(
  github_pat: string,
  org: string,
  hook_id: number,
  delivery_id: number
) {
  return githubWebhookRequest(
    github_pat,
    organizationWebhookUrl(org, `/${hook_id}/deliveries/${delivery_id}/attempts`),
    { method: "POST" }
  );
}
