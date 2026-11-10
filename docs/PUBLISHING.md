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
