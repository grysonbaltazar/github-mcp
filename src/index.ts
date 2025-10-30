#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';

// Initialize GitHub API client
const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

// Define available tools
const tools: Tool[] = [
  {
    name: 'get_repository',
    description: 'Get detailed information about a GitHub repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner (username or organization)',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'list_user_repos',
    description: 'List repositories for a user or organization',
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'GitHub username or organization name',
        },
        type: {
          type: 'string',
          description: 'Type of repos to list: all, owner, member',
          enum: ['all', 'owner', 'member'],
          default: 'all',
        },
        sort: {
          type: 'string',
          description: 'Sort by: created, updated, pushed, full_name',
          enum: ['created', 'updated', 'pushed', 'full_name'],
          default: 'updated',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      required: ['username'],
    },
  },
  {
    name: 'search_repositories',
    description: 'Search for repositories on GitHub',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "language:typescript stars:>1000")',
        },
        sort: {
          type: 'string',
          description: 'Sort by: stars, forks, updated',
          enum: ['stars', 'forks', 'updated'],
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_pull_request',
    description: 'Get details about a specific pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        pull_number: {
          type: 'number',
          description: 'Pull request number',
        },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'list_pull_requests',
    description: 'List pull requests for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        state: {
          type: 'string',
          description: 'PR state: open, closed, all',
          enum: ['open', 'closed', 'all'],
          default: 'open',
        },
        sort: {
          type: 'string',
          description: 'Sort by: created, updated, popularity',
          enum: ['created', 'updated', 'popularity'],
          default: 'created',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_pr_files',
    description: 'Get the list of files changed in a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        pull_number: {
          type: 'number',
          description: 'Pull request number',
        },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'get_pr_comments',
    description: 'Get review comments on a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        pull_number: {
          type: 'number',
          description: 'Pull request number',
        },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'get_commit',
    description: 'Get details about a specific commit',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        ref: {
          type: 'string',
          description: 'Commit SHA or branch name',
        },
      },
      required: ['owner', 'repo', 'ref'],
    },
  },
  {
    name: 'list_commits',
    description: 'List commits in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        sha: {
          type: 'string',
          description: 'Branch name or commit SHA to start from',
        },
        path: {
          type: 'string',
          description: 'Only commits containing this file path',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'compare_commits',
    description: 'Compare two commits or branches',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        base: {
          type: 'string',
          description: 'Base branch or commit SHA',
        },
        head: {
          type: 'string',
          description: 'Head branch or commit SHA',
        },
      },
      required: ['owner', 'repo', 'base', 'head'],
    },
  },
  {
    name: 'get_issue',
    description: 'Get details about a specific issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        issue_number: {
          type: 'number',
          description: 'Issue number',
        },
      },
      required: ['owner', 'repo', 'issue_number'],
    },
  },
  {
    name: 'list_issues',
    description: 'List issues for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        state: {
          type: 'string',
          description: 'Issue state: open, closed, all',
          enum: ['open', 'closed', 'all'],
          default: 'open',
        },
        labels: {
          type: 'string',
          description: 'Comma-separated list of label names',
        },
        sort: {
          type: 'string',
          description: 'Sort by: created, updated, comments',
          enum: ['created', 'updated', 'comments'],
          default: 'created',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_issue_comments',
    description: 'Get comments on an issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        issue_number: {
          type: 'number',
          description: 'Issue number',
        },
      },
      required: ['owner', 'repo', 'issue_number'],
    },
  },
  {
    name: 'list_branches',
    description: 'List branches in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_branch',
    description: 'Get details about a specific branch',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        branch: {
          type: 'string',
          description: 'Branch name',
        },
      },
      required: ['owner', 'repo', 'branch'],
    },
  },
  {
    name: 'get_user',
    description: 'Get information about a GitHub user',
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'GitHub username',
        },
      },
      required: ['username'],
    },
  },
  {
    name: 'search_users',
    description: 'Search for users on GitHub',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "location:seattle language:javascript")',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_file_contents',
    description: 'Get the contents of a file in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        path: {
          type: 'string',
          description: 'Path to the file',
        },
        ref: {
          type: 'string',
          description: 'Branch, tag, or commit SHA (defaults to default branch)',
        },
      },
      required: ['owner', 'repo', 'path'],
    },
  },
  {
    name: 'list_releases',
    description: 'List releases for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
        per_page: {
          type: 'number',
          description: 'Results per page (max 100)',
          default: 30,
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'get_latest_release',
    description: 'Get the latest release for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description: 'Repository owner',
        },
        repo: {
          type: 'string',
          description: 'Repository name',
        },
      },
      required: ['owner', 'repo'],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: 'github-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_repository': {
        const { owner, repo } = args as { owner: string; repo: string };
        const response = await octokit.repos.get({ owner, repo });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_user_repos': {
        const { username, type = 'all', sort = 'updated', per_page = 30 } = args as {
          username: string;
          type?: 'all' | 'owner' | 'member';
          sort?: 'created' | 'updated' | 'pushed' | 'full_name';
          per_page?: number;
        };
        const response = await octokit.repos.listForUser({
          username,
          type,
          sort,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'search_repositories': {
        const { query, sort, per_page = 30 } = args as {
          query: string;
          sort?: 'stars' | 'forks' | 'updated';
          per_page?: number;
        };
        const response = await octokit.search.repos({
          q: query,
          sort,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_pull_request': {
        const { owner, repo, pull_number } = args as {
          owner: string;
          repo: string;
          pull_number: number;
        };
        const response = await octokit.pulls.get({
          owner,
          repo,
          pull_number,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_pull_requests': {
        const { owner, repo, state = 'open', sort = 'created', per_page = 30 } = args as {
          owner: string;
          repo: string;
          state?: 'open' | 'closed' | 'all';
          sort?: 'created' | 'updated' | 'popularity';
          per_page?: number;
        };
        const response = await octokit.pulls.list({
          owner,
          repo,
          state,
          sort,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_pr_files': {
        const { owner, repo, pull_number } = args as {
          owner: string;
          repo: string;
          pull_number: number;
        };
        const response = await octokit.pulls.listFiles({
          owner,
          repo,
          pull_number,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_pr_comments': {
        const { owner, repo, pull_number } = args as {
          owner: string;
          repo: string;
          pull_number: number;
        };
        const response = await octokit.pulls.listReviewComments({
          owner,
          repo,
          pull_number,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_commit': {
        const { owner, repo, ref } = args as {
          owner: string;
          repo: string;
          ref: string;
        };
        const response = await octokit.repos.getCommit({
          owner,
          repo,
          ref,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_commits': {
        const { owner, repo, sha, path, per_page = 30 } = args as {
          owner: string;
          repo: string;
          sha?: string;
          path?: string;
          per_page?: number;
        };
        const response = await octokit.repos.listCommits({
          owner,
          repo,
          sha,
          path,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'compare_commits': {
        const { owner, repo, base, head } = args as {
          owner: string;
          repo: string;
          base: string;
          head: string;
        };
        const response = await octokit.repos.compareCommits({
          owner,
          repo,
          base,
          head,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_issue': {
        const { owner, repo, issue_number } = args as {
          owner: string;
          repo: string;
          issue_number: number;
        };
        const response = await octokit.issues.get({
          owner,
          repo,
          issue_number,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_issues': {
        const { owner, repo, state = 'open', labels, sort = 'created', per_page = 30 } = args as {
          owner: string;
          repo: string;
          state?: 'open' | 'closed' | 'all';
          labels?: string;
          sort?: 'created' | 'updated' | 'comments';
          per_page?: number;
        };
        const response = await octokit.issues.listForRepo({
          owner,
          repo,
          state,
          labels,
          sort,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_issue_comments': {
        const { owner, repo, issue_number } = args as {
          owner: string;
          repo: string;
          issue_number: number;
        };
        const response = await octokit.issues.listComments({
          owner,
          repo,
          issue_number,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_branches': {
        const { owner, repo, per_page = 30 } = args as {
          owner: string;
          repo: string;
          per_page?: number;
        };
        const response = await octokit.repos.listBranches({
          owner,
          repo,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_branch': {
        const { owner, repo, branch } = args as {
          owner: string;
          repo: string;
          branch: string;
        };
        const response = await octokit.repos.getBranch({
          owner,
          repo,
          branch,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_user': {
        const { username } = args as { username: string };
        const response = await octokit.users.getByUsername({ username });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'search_users': {
        const { query, per_page = 30 } = args as {
          query: string;
          per_page?: number;
        };
        const response = await octokit.search.users({
          q: query,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_file_contents': {
        const { owner, repo, path, ref } = args as {
          owner: string;
          repo: string;
          path: string;
          ref?: string;
        };
        const response = await octokit.repos.getContent({
          owner,
          repo,
          path,
          ref,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'list_releases': {
        const { owner, repo, per_page = 30 } = args as {
          owner: string;
          repo: string;
          per_page?: number;
        };
        const response = await octokit.repos.listReleases({
          owner,
          repo,
          per_page,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case 'get_latest_release': {
        const { owner, repo } = args as { owner: string; repo: string };
        const response = await octokit.repos.getLatestRelease({
          owner,
          repo,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

