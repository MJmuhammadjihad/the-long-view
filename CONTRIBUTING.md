# Contributing to The Long View

Thank you for helping make the guide clearer, more useful, and easier to inspect. Small corrections are welcome; you do not need to propose a new feature.

## Good places to start

- Replace a broken source link with a verified primary source.
- Explain a confusing assumption in a calculator.
- Reproduce a keyboard, small-screen, or print problem.
- Add a meaningful boundary case to a calculator test.
- Propose a regional example with its date, eligibility limits, and evidence.

Use an existing issue when it describes your change. For a substantial feature or change in advice, open a proposal before investing in implementation. You can submit a focused correction directly.

## Set up and check a change

```sh
git clone https://github.com/MJmuhammadjihad/the-long-view.git
cd the-long-view
python3 build.py
npm ci
npm test
python3 -m http.server 8000 --directory dist
```

Edit the source files, rebuild generated output, and include the resulting changes in your pull request. Keep a change focused enough to review. In the PR, explain the user-facing problem, the result, and how you checked it.

For visual changes, check keyboard navigation and at least a narrow and a wide viewport when browser tooling is available. Say explicitly what you could not verify. A passing DOM test does not establish that a rendered page has no layout bugs.

## Research and advice changes

Follow [the research policy](docs/RESEARCH.md). Prefer primary sources, include the relevant publication and access dates, and describe what the evidence cannot establish. A job listing is an example, not a wage distribution. A growing need is not proof of a profitable business. A US or global finding is not automatically a local forecast.

When changing a recommendation, include its strongest material counterargument and the evidence that would change your view. Avoid unsourced rankings, success probabilities, and claims of guaranteed returns.

## Calculator changes

Document inputs, units, timing, assumptions, and exclusions. Test a realistic case and important boundaries: missing values, zero, a shortfall, and invalid input. Prefer a test that can catch a plausible financial or logic mistake over one that simply repeats the implementation.

Never silently reinterpret a user’s saved data or discard it during a migration. Restore operations should make replacement clear before changing notes.

## Privacy and community

Use synthetic data in examples, tests, and screenshots. Do not commit private financial details, credentials, browser exports, or another person’s information. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Contributions are made under the project’s [MIT License](LICENSE). Do not copy third-party articles or assets unless their license permits it and attribution is included. AI-assisted contributions are welcome when their author checks the result, identifies material limitations, and takes responsibility for it.

## Source map

- `content/*.html`: the 12 chapters; edit the relevant chapter directly.
- `research-sources.json`: the bibliography and source limitations. Source numbers are stable array positions; append instead of renumbering existing entries.
- `script.js`: navigation, calculators and local notebook behavior.
- `styles.css`: responsive and print styles.
- `site.json`: version, release date and public URLs.
- `assets/`: original vector cover, favicon and social preview PNG.
- `build.py`: deterministic standard-library builder; `dist/` is generated and committed.
- `tests/`: DOM interaction checks and structural/build invariants.

After editing a source limitation, rebuild and inspect the rendered claim too: the bibliography does not rewrite the chapter’s interpretation. If you add a reference, update the visible source-count descriptions and relevant tests.
