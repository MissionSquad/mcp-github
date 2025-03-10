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
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // const CallToolRequestPATSchema = CallToolRequestSchema.extend({
    //   github_pat: z.string().describe("GitHub Personal Access Token"),
    // });
    // const requestWithPat = CallToolRequestPATSchema.parse(request);
    const { params } = request;
    if (!params.arguments) {
      throw new Error("Arguments are required");
    }
    if (!params.arguments.github_pat) {
      throw new Error("GitHub PAT is required");
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
        const contents = await files.getFileContents(
          args.github_pat,
          args.owner,
          args.repo,
          args.path,
          args.branch
        );
        return {
          content: [{ type: "text", text: JSON.stringify(contents, null, 2) }],
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