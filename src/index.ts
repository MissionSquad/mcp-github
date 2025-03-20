#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import * as repository from './operations/repository.js';
import * as files from './operations/files.js';
import * as issues from './operations/issues.js';
import * as pulls from './operations/pulls.js';
import * as branches from './operations/branches.js';
import * as search from './operations/search.js';
import * as commits from './operations/commits.js';
import * as releases from './operations/releases.js';
import * as statuses from './operations/statuses.js';
import * as rate_limit from './operations/rate_limit.js';
import * as gists from './operations/gists.js';
import * as projects from './operations/projects.js';
import * as packages from './operations/packages.js';
import {
  GitHubError,
  GitHubValidationError,
  GitHubResourceNotFoundError,
  GitHubAuthenticationError,
  GitHubPermissionError,
  GitHubRateLimitError,
  GitHubConflictError,
  isGitHubError,
} from './common/errors.js';
import { VERSION } from "./common/version.js";

// const CallToolRequestPATSchema = CallToolRequestSchema.extend({
//   github_pat: z.string().describe("GitHub Personal Access Token"),
// });

const server = new Server(
  {
    name: "mcp-github",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

function formatGitHubError(error: GitHubError): string {
  let message = `GitHub API Error: ${error.message}`;

  if (error instanceof GitHubValidationError) {
    message = `Validation Error: ${error.message}`;
    if (error.response) {
      message += `\nDetails: ${JSON.stringify(error.response)}`;
    }
  } else if (error instanceof GitHubResourceNotFoundError) {
    message = `Not Found: ${error.message}`;
  } else if (error instanceof GitHubAuthenticationError) {
    message = `Authentication Failed: ${error.message}`;
  } else if (error instanceof GitHubPermissionError) {
    message = `Permission Denied: ${error.message}`;
  } else if (error instanceof GitHubRateLimitError) {
    message = `Rate Limit Exceeded: ${error.message}\nResets at: ${error.resetAt.toISOString()}`;
  } else if (error instanceof GitHubConflictError) {
    message = `Conflict: ${error.message}`;
  }

  return message;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_or_update_file",
        description: "Create or update a single file in a GitHub repository",
        inputSchema: zodToJsonSchema(files.CreateOrUpdateFileSchema),
      },
      {
        name: "search_repositories",
        description: "Search for GitHub repositories",
        inputSchema: zodToJsonSchema(repository.SearchRepositoriesSchema),
      },
      {
        name: "create_repository",
        description: "Create a new GitHub repository in your account",
        inputSchema: zodToJsonSchema(repository.CreateRepositoryOptionsSchema),
      },
      {
        name: "get_file_contents",
        description: "Get the contents of a file or directory from a GitHub repository",
        inputSchema: zodToJsonSchema(files.GetFileContentsSchema),
      },
      {
        name: "push_files",
        description: "Push multiple files to a GitHub repository in a single commit",
        inputSchema: zodToJsonSchema(files.PushFilesSchema),
      },
      {
        name: "create_issue",
        description: "Create a new issue in a GitHub repository",
        inputSchema: zodToJsonSchema(issues.CreateIssueSchema),
      },
      {
        name: "create_pull_request",
        description: "Create a new pull request in a GitHub repository",
        inputSchema: zodToJsonSchema(pulls.CreatePullRequestSchema),
      },
      {
        name: "fork_repository",
        description: "Fork a GitHub repository to your account or specified organization",
        inputSchema: zodToJsonSchema(repository.ForkRepositorySchema),
      },
      {
        name: "create_branch",
        description: "Create a new branch in a GitHub repository",
        inputSchema: zodToJsonSchema(branches.CreateBranchSchema),
      },
      {
        name: "list_commits",
        description: "Get list of commits of a branch in a GitHub repository",
        inputSchema: zodToJsonSchema(commits.ListCommitsSchema)
      },
      {
        name: "list_issues",
        description: "List issues in a GitHub repository with filtering options",
        inputSchema: zodToJsonSchema(issues.ListIssuesOptionsSchema)
      },
      {
        name: "update_issue",
        description: "Update an existing issue in a GitHub repository",
        inputSchema: zodToJsonSchema(issues.UpdateIssueOptionsSchema)
      },
      {
        name: "add_issue_comment",
        description: "Add a comment to an existing issue",
        inputSchema: zodToJsonSchema(issues.IssueCommentSchema)
      },
      {
        name: "search_code",
        description: "Search for code across GitHub repositories",
        inputSchema: zodToJsonSchema(search.SearchCodeSchema),
      },
      {
        name: "search_issues",
        description: "Search for issues and pull requests across GitHub repositories",
        inputSchema: zodToJsonSchema(search.SearchIssuesSchema),
      },
      {
        name: "search_users",
        description: "Search for users on GitHub",
        inputSchema: zodToJsonSchema(search.SearchUsersSchema),
      },
      {
        name: "get_issue",
        description: "Get details of a specific issue in a GitHub repository.",
        inputSchema: zodToJsonSchema(issues.GetIssueSchema)
      },
      // Releases and Tags
      {
        name: "create_release",
        description: "Create a new release in a GitHub repository",
        inputSchema: zodToJsonSchema(releases.CreateReleaseSchema),
      },
      {
        name: "list_releases",
        description: "List releases for a GitHub repository",
        inputSchema: zodToJsonSchema(releases.ListReleasesSchema),
      },
      {
        name: "delete_release",
        description: "Delete a release from a GitHub repository",
        inputSchema: zodToJsonSchema(releases.DeleteReleaseSchema),
      },
      {
        name: "get_release_asset",
        description: "Get a release asset from a GitHub repository",
        inputSchema: zodToJsonSchema(releases.GetReleaseAssetSchema),
      },
      {
        name: "upload_release_asset",
        description: "Upload an asset to a GitHub release",
        inputSchema: zodToJsonSchema(releases.UploadReleaseAssetSchema),
      },
      {
        name: "create_tag",
        description: "Create a new tag in a GitHub repository",
        inputSchema: zodToJsonSchema(releases.CreateTagSchema),
      },
      // Pull Request Reviews
      {
        name: "create_pull_request_review",
        description: "Create a review for a pull request",
        inputSchema: zodToJsonSchema(pulls.CreatePullRequestReviewSchema),
      },
      {
        name: "submit_pull_request_review",
        description: "Submit a pull request review (approve, request changes, or comment)",
        inputSchema: zodToJsonSchema(pulls.SubmitPullRequestReviewSchema),
      },
      {
        name: "dismiss_pull_request_review",
        description: "Dismiss a pull request review",
        inputSchema: zodToJsonSchema(pulls.DismissPullRequestReviewSchema),
      },
      // Statuses and Checks
      {
        name: "create_commit_status",
        description: "Create a status for a commit (build passed/failed, etc.)",
        inputSchema: zodToJsonSchema(statuses.CreateCommitStatusSchema),
      },
      {
        name: "get_commit_statuses",
        description: "Get statuses for a commit",
        inputSchema: zodToJsonSchema(statuses.GetCommitStatusesSchema),
      },
      {
        name: "get_combined_status",
        description: "Get the combined status for a commit",
        inputSchema: zodToJsonSchema(statuses.GetCombinedStatusSchema),
      },
      // Rate Limit Info
      {
        name: "get_rate_limit",
        description: "Check the current rate limit status",
        inputSchema: zodToJsonSchema(rate_limit.GetRateLimitSchema),
      },
      // Gists
      {
        name: "create_gist",
        description: "Create a new gist",
        inputSchema: zodToJsonSchema(gists.CreateGistSchema),
      },
      {
        name: "list_gists",
        description: "List gists for the authenticated user",
        inputSchema: zodToJsonSchema(gists.ListGistsSchema),
      },
      {
        name: "get_gist",
        description: "Get a specific gist",
        inputSchema: zodToJsonSchema(gists.GetGistSchema),
      },
      // Project Boards
      {
        name: "list_projects",
        description: "List projects for a repository",
        inputSchema: zodToJsonSchema(projects.ListProjectsSchema),
      },
      {
        name: "create_project",
        description: "Create a new project for a repository",
        inputSchema: zodToJsonSchema(projects.CreateProjectSchema),
      },
      {
        name: "list_project_columns",
        description: "List columns for a project",
        inputSchema: zodToJsonSchema(projects.ListProjectColumnsSchema),
      },
      {
        name: "create_project_column",
        description: "Create a new column for a project",
        inputSchema: zodToJsonSchema(projects.CreateProjectColumnSchema),
      },
      {
        name: "create_project_card",
        description: "Create a new card in a project column",
        inputSchema: zodToJsonSchema(projects.CreateProjectCardSchema),
      },
      // Packages
      {
        name: "list_org_packages",
        description: "List packages for an organization",
        inputSchema: zodToJsonSchema(packages.ListOrgPackagesSchema),
      },
      {
        name: "list_user_packages",
        description: "List packages for a user",
        inputSchema: zodToJsonSchema(packages.ListUserPackagesSchema),
      },
      {
        name: "list_repo_packages",
        description: "List packages for a repository",
        inputSchema: zodToJsonSchema(packages.ListRepoPackagesSchema),
      },
      {
        name: "get_org_package",
        description: "Get a package for an organization",
        inputSchema: zodToJsonSchema(packages.GetOrgPackageSchema),
      },
      {
        name: "get_user_package",
        description: "Get a package for a user",
        inputSchema: zodToJsonSchema(packages.GetUserPackageSchema),
      },
      {
        name: "get_repo_package",
        description: "Get a package for a repository",
        inputSchema: zodToJsonSchema(packages.GetRepoPackageSchema),
      },
      // Pull Request Diff
      {
        name: "get_pull_request_diff",
        description: "Get the diff for a pull request",
        inputSchema: zodToJsonSchema(pulls.GetPullRequestDiffSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { params } = request;
    if (!params.arguments) {
      throw new Error("Arguments are required");
    }
    if (!params.arguments.github_pat) {
      if (process.env.GITHUB_PAT != null && process.env.GITHUB_PAT.trim() !== "") {
        params.arguments.github_pat = process.env.GITHUB_PAT;
      } else if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN != null && process.env.GITHUB_PERSONAL_ACCESS_TOKEN.trim() !== "") {
        params.arguments.github_pat = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
      } else {
        throw new Error("GitHub PAT is required");
      }
    }
    switch (params.name) {
      case "fork_repository": {
        const args = repository._ForkRepositorySchema.parse(params.arguments);
        const fork = await repository.forkRepository(args.github_pat, args.owner, args.repo, args.organization);
        return {
          content: [{ type: "text", text: JSON.stringify(fork, null, 2) }],
        };
      }

      case "create_branch": {
        const args = branches._CreateBranchSchema.parse(params.arguments);
        const branch = await branches.createBranchFromRef(
          args.github_pat,
          args.owner,
          args.repo,
          args.branch,
          args.from_branch
        );
        return {
          content: [{ type: "text", text: JSON.stringify(branch, null, 2) }],
        };
      }

      case "search_repositories": {
        const args = repository._SearchRepositoriesSchema.parse(params.arguments);
        const results = await repository.searchRepositories(
          args.github_pat,
          args.query,
          args.page,
          args.perPage
        );
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "create_repository": {
        const argsWithPat = repository._CreateRepositoryOptionsSchema.parse(params.arguments);
        const { github_pat, ...args } = argsWithPat;
        const result = await repository.createRepository(github_pat, args);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_file_contents": {
        const args = files._GetFileContentsSchema.parse(params.arguments);
        const contents = await files.getFileContents(args);
        let text = '';
        if (Array.isArray(contents)) {
          // this means it's a directory
          text = `Directory Contents:\n${contents.map(c => `- ${c.path} (${c.type}, ${c.type === 'file' ? c.size.toString() + ' bytes' : ''})`).join('\n')}`
        } else {
          // this means it's a singular file
          text = 
`File Name: ${contents.name}
File Path: ${contents.path}
File SHA: ${contents.sha}
File Size: ${contents.size}
File URL: ${contents.url}
File HTML URL: ${contents.html_url}
File Download URL: ${contents.download_url}
File Type: ${contents.type}
File Encoding: ${contents.encoding}
File Content:
\`\`\`
${contents.content}
\`\`\`
`
        }
        return {
          content: [{ type: "text", text }],
        };
      }

      case "create_or_update_file": {
        const args = files._CreateOrUpdateFileSchema.parse(params.arguments);
        const result = await files.createOrUpdateFile(
          args.github_pat,
          args.owner,
          args.repo,
          args.path,
          args.content,
          args.message,
          args.branch,
          args.sha
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "push_files": {
        const args = files._PushFilesSchema.parse(params.arguments);
        const result = await files.pushFiles(
          args.github_pat,
          args.owner,
          args.repo,
          args.branch,
          args.files,
          args.message
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "create_issue": {
        const args = issues._CreateIssueSchema.parse(params.arguments);
        const { github_pat, owner, repo, ...options } = args;
        const issue = await issues.createIssue(github_pat, owner, repo, options);
        return {
          content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
        };
      }

      case "create_pull_request": {
        const argsWithPat = pulls._CreatePullRequestSchema.parse(params.arguments);
        const { github_pat, ...args } = argsWithPat;
        const pullRequest = await pulls.createPullRequest(github_pat, args);
        return {
          content: [{ type: "text", text: JSON.stringify(pullRequest, null, 2) }],
        };
      }

      case "search_code": {
        const argsWithPat = search._SearchCodeSchema.parse(params.arguments);
        const { github_pat, ...args } = argsWithPat;
        const results = await search.searchCode(github_pat, args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "search_issues": {
        const argsWithPat = search._SearchIssuesSchema.parse(params.arguments);
        const { github_pat, ...args } = argsWithPat;
        const results = await search.searchIssues(github_pat, args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "search_users": {
        const argsWithPat = search._SearchUsersSchema.parse(params.arguments);
        const { github_pat, ...args } = argsWithPat;
        const results = await search.searchUsers(github_pat, args);
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "list_issues": {
        const args = issues._ListIssuesOptionsSchema.parse(params.arguments);
        const { github_pat, owner, repo, ...options } = args;
        const result = await issues.listIssues(github_pat, owner, repo, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "update_issue": {
        const argsWithPat = issues._UpdateIssueOptionsSchema.parse(params.arguments);
        const { github_pat, owner, repo, issue_number, ...options } = argsWithPat;
        const result = await issues.updateIssue(github_pat, owner, repo, issue_number, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "add_issue_comment": {
        const argsWithPat = issues._IssueCommentSchema.parse(params.arguments);
        const { github_pat, owner, repo, issue_number, body } = argsWithPat;
        const result = await issues.addIssueComment(github_pat, owner, repo, issue_number, body);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_commits": {
        const args = commits._ListCommitsSchema.parse(params.arguments);
        const results = await commits.listCommits(
          args.github_pat,
          args.owner,
          args.repo,
          args.page,
          args.perPage,
          args.sha
        );
        return {
          content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
      }

      case "get_issue": {
        const args = issues._GetIssueSchema.parse(params.arguments);
        const issue = await issues.getIssue(args.github_pat, args.owner, args.repo, args.issue_number);
        return {
          content: [{ type: "text", text: JSON.stringify(issue, null, 2) }],
        };
      }

      // Releases and Tags
      case "create_release": {
        const args = releases._CreateReleaseSchema.parse(params.arguments);
        const { github_pat, owner, repo, ...options } = args;
        const result = await releases.createRelease(github_pat, owner, repo, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_releases": {
        const args = releases._ListReleasesSchema.parse(params.arguments);
        const { github_pat, owner, repo, ...options } = args;
        const result = await releases.listReleases(github_pat, owner, repo, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "delete_release": {
        const args = releases._DeleteReleaseSchema.parse(params.arguments);
        await releases.deleteRelease(args.github_pat, args.owner, args.repo, args.release_id);
        return {
          content: [{ type: "text", text: JSON.stringify({ success: true }, null, 2) }],
        };
      }

      case "get_release_asset": {
        const args = releases._GetReleaseAssetSchema.parse(params.arguments);
        const result = await releases.getReleaseAsset(args.github_pat, args.owner, args.repo, args.asset_id);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "upload_release_asset": {
        const args = releases._UploadReleaseAssetSchema.parse(params.arguments);
        const { github_pat, owner, repo, release_id, name, content, content_type, label } = args;
        const result = await releases.uploadReleaseAsset(
          github_pat, owner, repo, release_id, name, content, content_type, label
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "create_tag": {
        const args = releases._CreateTagSchema.parse(params.arguments);
        const { github_pat, owner, repo, ref, sha } = args;
        const result = await releases.createTag(github_pat, owner, repo, ref, sha);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Pull Request Reviews
      case "create_pull_request_review": {
        const args = pulls._CreatePullRequestReviewSchema.parse(params.arguments);
        const { github_pat, owner, repo, pull_number, ...options } = args;
        const result = await pulls.createPullRequestReview(github_pat, owner, repo, pull_number, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "submit_pull_request_review": {
        const args = pulls._SubmitPullRequestReviewSchema.parse(params.arguments);
        const { github_pat, owner, repo, pull_number, review_id, event, body } = args;
        const result = await pulls.submitPullRequestReview(
          github_pat, owner, repo, pull_number, review_id, event, body
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "dismiss_pull_request_review": {
        const args = pulls._DismissPullRequestReviewSchema.parse(params.arguments);
        const { github_pat, owner, repo, pull_number, review_id, message } = args;
        const result = await pulls.dismissPullRequestReview(
          github_pat, owner, repo, pull_number, review_id, message
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Statuses and Checks
      case "create_commit_status": {
        const args = statuses._CreateCommitStatusSchema.parse(params.arguments);
        const { github_pat, owner, repo, sha, state, ...options } = args;
        const result = await statuses.createCommitStatus(github_pat, owner, repo, sha, state, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_commit_statuses": {
        const args = statuses._GetCommitStatusesSchema.parse(params.arguments);
        const { github_pat, owner, repo, ref } = args;
        const result = await statuses.getCommitStatuses(github_pat, owner, repo, ref);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_combined_status": {
        const args = statuses._GetCombinedStatusSchema.parse(params.arguments);
        const { github_pat, owner, repo, ref } = args;
        const result = await statuses.getCombinedStatus(github_pat, owner, repo, ref);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Rate Limit Info
      case "get_rate_limit": {
        const args = rate_limit._GetRateLimitSchema.parse(params.arguments);
        const result = await rate_limit.getRateLimit(args.github_pat);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Gists
      case "create_gist": {
        const args = gists._CreateGistSchema.parse(params.arguments);
        const { github_pat, description, public: isPublic, files } = args;
        const result = await gists.createGist(github_pat, description, isPublic, files);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_gists": {
        const args = gists._ListGistsSchema.parse(params.arguments);
        const { github_pat, ...options } = args;
        const result = await gists.listGists(github_pat, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_gist": {
        const args = gists._GetGistSchema.parse(params.arguments);
        const { github_pat, gist_id } = args;
        const result = await gists.getGist(github_pat, gist_id);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Project Boards
      case "list_projects": {
        const args = projects._ListProjectsSchema.parse(params.arguments);
        const { github_pat, owner, repo, ...options } = args;
        const result = await projects.listProjects(github_pat, owner, repo, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "create_project": {
        const args = projects._CreateProjectSchema.parse(params.arguments);
        const { github_pat, owner, repo, name, body } = args;
        const result = await projects.createProject(github_pat, owner, repo, name, body);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_project_columns": {
        const args = projects._ListProjectColumnsSchema.parse(params.arguments);
        const { github_pat, project_id, ...options } = args;
        const result = await projects.listProjectColumns(github_pat, project_id, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "create_project_column": {
        const args = projects._CreateProjectColumnSchema.parse(params.arguments);
        const { github_pat, project_id, name } = args;
        const result = await projects.createProjectColumn(github_pat, project_id, name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "create_project_card": {
        const args = projects._CreateProjectCardSchema.parse(params.arguments);
        const { github_pat, column_id, note } = args;
        const result = await projects.createProjectCard(github_pat, column_id, note);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Packages
      case "list_org_packages": {
        const args = packages._ListOrgPackagesSchema.parse(params.arguments);
        const { github_pat, org, ...options } = args;
        const result = await packages.listOrgPackages(github_pat, org, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_user_packages": {
        const args = packages._ListUserPackagesSchema.parse(params.arguments);
        const { github_pat, username, ...options } = args;
        const result = await packages.listUserPackages(github_pat, username, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "list_repo_packages": {
        const args = packages._ListRepoPackagesSchema.parse(params.arguments);
        const { github_pat, owner, repo, ...options } = args;
        const result = await packages.listRepoPackages(github_pat, owner, repo, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_org_package": {
        const args = packages._GetOrgPackageSchema.parse(params.arguments);
        const { github_pat, org, package_type, package_name } = args;
        const result = await packages.getOrgPackage(github_pat, org, package_type, package_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_user_package": {
        const args = packages._GetUserPackageSchema.parse(params.arguments);
        const { github_pat, username, package_type, package_name } = args;
        const result = await packages.getUserPackage(github_pat, username, package_type, package_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_repo_package": {
        const args = packages._GetRepoPackageSchema.parse(params.arguments);
        const { github_pat, owner, repo, package_type, package_name } = args;
        const result = await packages.getRepoPackage(github_pat, owner, repo, package_type, package_name);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      // Pull Request Diff
      case "get_pull_request_diff": {
        const args = pulls._GetPullRequestDiffSchema.parse(params.arguments);
        const { github_pat, owner, repo, pull_number } = args;
        const result = await pulls.getPullRequestDiff(github_pat, owner, repo, pull_number);
        return {
          content: [{ type: "text", text: result }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    if (isGitHubError(error)) {
      throw new Error(formatGitHubError(error));
    }
    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GitHub MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
