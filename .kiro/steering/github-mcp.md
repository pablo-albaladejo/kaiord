# GitHub MCP Integration

Kaiord uses the GitHub MCP (Model Context Protocol) server to enable direct GitHub interactions from Kiro.

## What is GitHub MCP?

The GitHub MCP server allows Kiro to interact with GitHub repositories directly:

- Create and manage issues
- Create and manage pull requests
- Add comments and reviews
- Search code and repositories
- Manage branches and releases
- And much more

## Configuration

### Prerequisites

1. **Docker** - The GitHub MCP server runs in a Docker container
2. **GitHub Personal Access Token (PAT)** - Required for authentication

### Setup Steps

#### 1. Run the Setup Script

The easiest way to configure GitHub MCP is using the automated setup script:

```bash
./scripts/setup-github-mcp.sh
```

This script will:

- ✅ Verify Docker is running
- ✅ Check/create `.env` file with your token
- ✅ Validate token format
- ✅ Add token to `~/.zshrc` for persistence
- ✅ Test GitHub API authentication
- ✅ Verify MCP configuration

#### 2. Create GitHub Personal Access Token

If you don't have a token yet:

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **Generate new token**
3. Configure:
   - **Token name**: "Kiro MCP - Kaiord"
   - **Expiration**: Choose your preferred expiration
   - **Repository access**: Select repositories you want to access
   - **Permissions**:
     - `Contents`: Read and write
     - `Issues`: Read and write
     - `Pull requests`: Read and write
     - `Metadata`: Read-only (automatic)
4. Copy the token (starts with `ghp_`)

#### 3. Configure Environment Variable

The setup script handles this automatically, but if needed manually:

**Option A: Shell Profile (Recommended)**

Add to `~/.zshrc`:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"
```

Then reload:

```bash
source ~/.zshrc
```

**Option B: Local .env File**

Create `.env` in the workspace root:

```bash
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
```

Then source it:

```bash
source .env
```

#### 4. Restart Kiro

After configuration, restart Kiro completely to load the environment variable.

#### 5. Reconnect MCP Server

From Kiro:

- Open the **MCP Server** panel
- Find the **github** server
- Click **reconnect** if needed

## Usage in Kiro

Once configured, you can ask Kiro to interact with GitHub:

### Examples

**List Pull Requests:**

```
Show me all open pull requests in this repository
```

**Create an Issue:**

```
Create an issue titled "Bug: Fix validation error" with description "..."
```

**Add PR Comment:**

```
Add a comment to PR #27 saying "LGTM, ready to merge"
```

**Search Code:**

```
Search for all files that use the FitReader interface
```

**Get PR Details:**

```
Show me the details and comments for PR #29
```

## Available MCP Tools

The GitHub MCP server provides these tools (auto-approved in our config):

- `pull_request_read` - Read PR details, comments, reviews, files
- `get_me` - Get authenticated user information
- `get_label` - Get repository labels
- `get_latest_release` - Get latest release information
- `list_pull_requests` - List PRs with filters
- `list_issues` - List issues with filters
- `add_issue_comment` - Add comments to issues/PRs
- `create_pull_request` - Create new PRs
- `update_pull_request` - Update existing PRs
- `search_code` - Search code across repositories
- `search_repositories` - Search for repositories
- And many more...

## Integration with Hooks

GitHub MCP is integrated into Kiro hooks for automated workflows:

### PR Creation Hook

When creating a PR, Kiro can:

- Create the PR with proper title and description
- Add labels automatically
- Request reviewers
- Link to related issues

### Code Review Hooks

When reviewing code, Kiro can:

- Add review comments to specific lines
- Approve or request changes
- Add general PR comments
- Update PR status

### Task Management

When working on tasks, Kiro can:

- Create issues for new tasks
- Update issue status
- Add progress comments
- Close issues when complete

## Troubleshooting

### Server Won't Connect

1. Verify Docker is running: `docker ps`
2. Check environment variable: `echo $GITHUB_PERSONAL_ACCESS_TOKEN`
3. Verify token has correct permissions on GitHub
4. Check MCP Server logs in Kiro's output panel

### Permission Denied Errors

Your token may not have the required scopes. Go to GitHub and edit the token to add missing permissions.

### Token Not Found

If Kiro can't find the token:

1. Ensure the environment variable is set in the shell that launched Kiro
2. Restart Kiro from a terminal where the variable is set
3. Or add the token to `~/.zshrc` and restart your terminal + Kiro

## Security Best Practices

- ✅ Never commit tokens to version control (`.env` is in `.gitignore`)
- ✅ Use fine-grained tokens with minimal required permissions
- ✅ Rotate tokens regularly
- ✅ Use different tokens for different projects/environments
- ✅ Revoke tokens immediately if compromised

## Configuration Files

- `.kiro/settings/mcp.json` - MCP server configuration (workspace-level)
- `.kiro/settings/README-mcp-github.md` - Detailed setup instructions
- `scripts/setup-github-mcp.sh` - Automated setup script
- `.env` - Local environment variables (gitignored)

## References

- [GitHub MCP Server](https://github.com/github/github-mcp-server) - Official GitHub MCP server
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [GitHub REST API](https://docs.github.com/en/rest) - GitHub API documentation
