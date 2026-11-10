# Publishing and repository presentation

The application is already configured for GitHub Pages. Pushes to `main` build, test and deploy it after Pages has been enabled with **GitHub Actions** as its source. The separate Checks workflow validates changes in pull requests.

To release a version, update `site.json`, `package.json`, the lockfile and changelog together, rebuild and test, commit, then push a matching semantic-version tag such as `v1.0.0`. The release workflow verifies the version, runs the checks and publishes an HTML file, ZIP and SHA-256 checksums. Do not move an already published tag to different code.

## About panel

GitHub integrations may be able to push code while being unable to change repository administration settings. If the About panel is blank, use its gear icon and paste:

**Description**

> Career decisions, with the numbers attached. Five interactive planning tools, 31 references, a private journal, and a standalone HTML guide.

**Website**

https://mjmuhammadjihad.github.io/the-long-view/

**Topics**

`career-development` `personal-finance` `decision-making` `financial-literacy` `offline-first` `education` `javascript` `open-source` `bangladesh`

These labels describe the project. They do not guarantee search ranking or engagement.

## Social preview

In repository **Settings → General → Social preview**, upload `assets/social-card.png` from this repository. It is an original cover illustration, not an app screenshot. The website already includes Open Graph metadata pointing to the same asset.

## Launch

Use [the launch kit](LAUNCH.md) for editable announcements, a short demonstration script and a measured distribution plan. Those drafts have not been sent to communities. Follow each community’s rules and keep claims tied to the shipped project.

## Validation limits

The current release has automated DOM, arithmetic, storage, source and build checks. Full browser layout and cross-browser tests have not been completed. Do not describe it as bug-free or externally validated.

## Apply missing About fields with verification

The reviewed `repository-details.json` files contain exact descriptions, website URLs and topic lists. Repository contents and About fields are separate: committing these manifests does not change GitHub settings.

In a terminal with Python 3 and an owner-authorized GitHub CLI login (`gh auth login`), clone this repository or use your existing checkout. Preview both repositories:

```sh
python3 scripts/sync_repository_details.py --repo MJmuhammadjihad/the-long-view --repo MJmuhammadjihad/AI-ML-Engineering-Portfolio
```

Apply the displayed missing fields:

```sh
python3 scripts/sync_repository_details.py --apply --repo MJmuhammadjihad/the-long-view --repo MJmuhammadjihad/AI-ML-Engineering-Portfolio
```

The helper fetches each requested repository’s reviewed manifest. It preserves nonempty descriptions and websites, retains existing topics, and verifies the result after writing. It is safe to run again after a partial failure. It never requests or prints access-token values. The `--apply` flag is the only way it sends writes.

A connection that can push source may still lack repository Administration access. A `403 Resource not accessible by integration` is a GitHub authorization failure; running this helper under the same restricted connection does not grant more permission. Use your own authorized owner session or edit the About panel and click **Save**. Social-preview uploads still require the GitHub settings interface.
