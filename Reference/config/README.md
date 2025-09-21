# GitHub Configuration

This directory contains secure configuration files for GitHub API integration.

## Files

- `github-config.json` - Contains the GitHub Personal Access Token and repository settings

## Security

⚠️ **IMPORTANT**: The `github-config.json` file contains sensitive information and should NEVER be committed to version control.

This file is automatically excluded by the `.gitignore` file to prevent accidental commits.

## Setup

1. Create your GitHub Personal Access Token at: https://github.com/settings/tokens
2. Update the `githubToken` field in `github-config.json`
3. Verify the `repoOwner` and `repoName` match your repository
4. The system will automatically load this configuration

## Usage

The token is automatically loaded by:
- `contract.html` - For contract signing and PDF uploads
- `admin-dashboard.html` - For admin operations

No user interface is needed - the token is loaded securely from this file.

## Backup

Keep a secure backup of your token. If you need to regenerate it:
1. Create a new token on GitHub
2. Update `github-config.json`
3. Test the functionality

## Troubleshooting

If you get "No GitHub token found" errors:
1. Check that `github-config.json` exists and is readable
2. Verify the token is valid and has the correct permissions
3. Ensure the repository settings match your actual repository 