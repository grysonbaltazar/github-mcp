# GitHub MCP Server

An MCP (Model Context Protocol) server that provides tools for interacting with the GitHub API. This server enables AI assistants to query repositories, pull requests, issues, commits, users, and more.

## Features

- 🔍 Search repositories and users
- 📦 Get repository information
- 🔀 List and view pull requests
- 🐛 List and view issues
- 📝 View commits and compare branches
- 👤 Get user information
- 📄 Read file contents from repositories
- 🏷️ List releases and branches

## Prerequisites

- Node.js (v18 or higher)
- A GitHub Personal Access Token

## Installation

1. Clone this repository:
```bash
git clone https://github.com/grysonbaltazar/github-mcp.git
cd github-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

## Configuration

### Get a GitHub Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "MCP Server")
4. Select scopes:
   - `repo` - Full control of private repositories
   - `read:user` - Read user profile data
   - `read:org` - Read org and team membership (optional)
5. Generate and copy the token

### For Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/github-mcp/build/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### For Cursor

Edit `~/.cursor/mcp_config.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/path/to/github-mcp/build/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

## Usage

Once configured, the MCP server provides the following tools:

- `get_repository` - Get detailed information about a repository
- `list_user_repos` - List repositories for a user or organization
- `search_repositories` - Search for repositories on GitHub
- `get_pull_request` - Get details about a specific pull request
- `list_pull_requests` - List pull requests for a repository
- `get_pr_files` - Get the list of files changed in a pull request
- `get_pr_comments` - Get review comments on a pull request
- `get_commit` - Get details about a specific commit
- `list_commits` - List commits in a repository
- `compare_commits` - Compare two commits or branches
- `get_issue` - Get details about a specific issue
- `list_issues` - List issues for a repository
- `get_issue_comments` - Get comments on an issue
- `list_branches` - List branches in a repository
- `get_branch` - Get details about a specific branch
- `get_user` - Get information about a GitHub user
- `search_users` - Search for users on GitHub
- `get_file_contents` - Get the contents of a file in a repository
- `list_releases` - List releases for a repository
- `get_latest_release` - Get the latest release for a repository

## Development

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node build/index.js
```

This will open a web interface where you can test all the tools interactively.

### Watch Mode

```bash
npm run watch
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

