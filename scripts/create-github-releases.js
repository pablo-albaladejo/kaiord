#!/usr/bin/env node

/**
 * Create GitHub releases for published packages.
 *
 * Environment variables:
 * - GITHUB_TOKEN: GitHub API token
 * - GITHUB_REPOSITORY: Repository in format "owner/repo"
 * - PUBLISHED_PACKAGES: (optional) JSON array of { name, version } from changesets/action.
 *   When not set, falls back to scanning package.json for all publishable packages.
 */

import fs from "fs";
import { execSync } from "child_process";

const PUBLISHABLE_DIRS = [
  "core",
  "fit",
  "tcx",
  "zwo",
  "garmin",
  "garmin-connect",
  "cli",
  "mcp",
  "ai",
];

function getPackagesFromEnv() {
  const raw = process.env.PUBLISHED_PACKAGES;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((pkg) => ({
      name: pkg.name,
      version: pkg.version,
      dir: `packages/${pkg.name.replace("@kaiord/", "")}`,
    }));
  } catch {
    console.warn(
      "⚠️  Could not parse PUBLISHED_PACKAGES, falling back to disk scan"
    );
    return null;
  }
}

function getPackagesFromDisk() {
  return PUBLISHABLE_DIRS.filter((d) =>
    fs.existsSync(`packages/${d}/package.json`)
  ).map((d) => {
    const pkg = JSON.parse(
      fs.readFileSync(`packages/${d}/package.json`, "utf8")
    );
    return { name: pkg.name, version: pkg.version, dir: `packages/${d}` };
  });
}

async function createGitHubReleases() {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token || !repository) {
    console.error(
      "❌ Missing required environment variables: GITHUB_TOKEN, GITHUB_REPOSITORY"
    );
    process.exit(1);
  }

  const [owner, repo] = repository.split("/");
  const packages = getPackagesFromEnv() ?? getPackagesFromDisk();

  console.log(
    `\n📦 Creating GitHub releases for ${packages.length} package(s)...\n`
  );

  for (const pkg of packages) {
    const tagName = `${pkg.name}@${pkg.version}`;

    try {
      // Check if release already exists
      const checkResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tagName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (checkResponse.ok) {
        console.log(`ℹ️  Release ${tagName} already exists, skipping`);
        continue;
      }

      // Build release notes
      let releaseNotes = `## 📦 ${pkg.name}\n\n`;
      releaseNotes += `**Version:** ${pkg.version}\n`;
      releaseNotes += `**npm:** [${pkg.name}@${pkg.version}](https://www.npmjs.com/package/${pkg.name}/v/${pkg.version})\n\n`;

      // Extract changelog
      const changelogPath = `${pkg.dir}/CHANGELOG.md`;
      if (fs.existsSync(changelogPath)) {
        try {
          const changelog = execSync(
            `./scripts/extract-changelog.sh "${changelogPath}" "${pkg.version}"`,
            { encoding: "utf8" }
          ).trim();

          if (changelog) {
            releaseNotes += `## Changelog\n\n${changelog}\n`;
          }
        } catch (error) {
          console.warn(`⚠️  Could not extract changelog: ${error.message}`);
        }
      }

      // Create the release
      const createResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tag_name: tagName,
            name: `${pkg.name} v${pkg.version}`,
            body: releaseNotes,
            draft: false,
            prerelease: false,
          }),
        }
      );

      if (!createResponse.ok) {
        const error = await createResponse.text();
        throw new Error(`GitHub API error: ${error}`);
      }

      const release = await createResponse.json();
      console.log(`✅ Created release: ${release.html_url}`);
    } catch (error) {
      console.error(
        `❌ Failed to create release for ${tagName}: ${error.message}`
      );
    }
  }

  console.log("\n✅ GitHub releases creation completed\n");
}

createGitHubReleases().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
