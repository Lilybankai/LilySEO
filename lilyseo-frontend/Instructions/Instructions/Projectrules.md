7. Project Rules (Previously .cursorrules)
Branching Strategy:

Use Gitflow or a simplified approach (e.g., main, develop, feature/XYZ).
Always create feature branches off develop or main.
Code Review:

All merges require at least one reviewer approval.
No direct commits to main without a PR.
Commits & Pull Requests:

Follow a consistent commit message format (e.g., Conventional Commits: feat:, fix:, chore:).
Provide descriptive PR titles and include references to tasks/tickets.
Documentation:

Maintain an up-to-date README with setup instructions.
Keep architectural diagrams or relevant docs updated.
Environment Management:

Use .env files for local dev, environment variables for production.
Never commit secrets or credentials to the repo.
Testing & CI/CD:

All new features must have test coverage.
The CI pipeline should run tests on each pull request.
Communication & Meetings:

Weekly stand-ups or check-ins to track progress.
Use Slack/Teams/Discord for day-to-day collaboration.