# GitHub MCP Server Configuration

This workspace is configured to use the official GitHub MCP server via Docker.

## Prerequisites

- Docker installed and running
- GitHub Personal Access Token (PAT)

## Setup Instructions

### 1. Create a GitHub Personal Access Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Click **Generate new token**
3. Configure the token:
   - **Token name**: Something descriptive like "Kiro MCP - Kaiord"
   - **Expiration**: Choose your preferred expiration
   - **Repository access**: Select the repositories you want to access (or "All repositories")
   - **Permissions**: Grant the following scopes:
     - **Repository permissions**:
       - `Contents`: Read and write (for reading/writing files)
       - `Issues`: Read and write (for managing issues)
       - `Pull requests`: Read and write (for managing PRs)
       - `Metadata`: Read-only (automatically included)
     - **Organization permissions** (if needed):
       - `Members`: Read-only (for organization access)
4. Click **Generate token** and copy it immediately (you won't see it again)

### 2. Set the Environment Variable

#### macOS / Linux

Add to your shell profile (`~/.zshrc`, `~/.bashrc`, or `~/.profile`):

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token_here"
```

Then reload your shell:

```bash
source ~/.zshrc  # or ~/.bashrc
```

#### Alternative: Use a Local .env File

Create a `.env` file in the workspace root (this file is gitignored):

```bash
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
```

Then source it before starting Kiro:

```bash
source .env
```

### 3. Verify Docker is Running

Ensure Docker is running:

```bash
docker ps
```

### 4. Restart Kiro

After setting the environment variable, restart Kiro to load the MCP server configuration.

You can verify the server is connected by checking the MCP Server view in the Kiro feature panel.

## Security Notes

- **Never commit your token** to version control
- The `.env` file is already in `.gitignore`
- The token is passed to Docker as an environment variable, not stored in the config
- Use fine-grained tokens with minimal required permissions
- Rotate tokens regularly

## Troubleshooting

### Server won't connect

1. Verify Docker is running: `docker ps`
2. Check the environment variable is set: `echo $GITHUB_PERSONAL_ACCESS_TOKEN`
3. Verify the token has correct permissions on GitHub
4. Check MCP Server logs in Kiro's output panel

### Permission denied errors

Your token may not have the required scopes. Go back to GitHub and edit the token to add missing permissions.

## Available MCP Tools

Once connected, you'll have access to GitHub operations like:

- Creating and managing issues
- Creating and managing pull requests
- Reading repository contents
- Searching code and repositories
- Managing branches
- And more...

Use these tools through Kiro's natural language interface.
