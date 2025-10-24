# Markdown to Confluence Tools

[![Discord](https://img.shields.io/discord/1102841755646316576)](https://discord.gg/3ZVEc3S48x)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/humanrightsconnected/markdown-confluence/badge)](https://api.securityscorecards.dev/projects/github.com/humanrightsconnected/markdown-confluence)
[![Known Vulnerabilities](https://snyk.io/test/github/humanrightsconnected/markdown-confluence/badge.svg)](https://snyk.io/test/github/humanrightsconnected/markdown-confluence)
![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/humanrightsconnected/markdown-confluence/release-please.yml)
![GitHub code size](https://img.shields.io/github/languages/code-size/humanrightsconnected/markdown-confluence)
![GitHub repo size](https://img.shields.io/github/repo-size/humanrightsconnected/markdown-confluence)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

Obsidian Downloads: ![GitHub all releases](https://img.shields.io/github/downloads/markdown-confluence/obsidian-integration/total)

Copyright © 2022 Atlassian Pty Ltd
Copyright © 2022 Atlassian US, Inc  

Welcome to the `Markdown to Confluence Tools` project! This mono repository contains a collection of tools to convert and publish your Markdown files to Confluence, while using the Atlassian Document Format (ADF). We provide you with an Obsidian plugin, an npm CLI, a Docker CLI, a GitHub Action, and an npm library.

We focus on providing an opinionated, simple publishing workflow, with [Obsidian](https://obsidian.md/) as the recommended editor. However, you can use our tools with any Markdown files.

All projects within this mono repo use the core npm library [@markdown-confluence/lib](https://www.npmjs.com/package/@markdown-confluence/lib) to provide the same features, ensuring consistent results across different interfaces.

## Table of Contents

- [Features](#features)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- Converts Markdown files to [Atlassian Document Format (ADF)](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/)
- Simple publishing workflow with [Obsidian](https://obsidian.md/) as the recommended editor
- Can be used with any Markdown files
- Supports Obsidian plugin, npm CLI, Docker CLI, GitHub Action, and npm library

## Documentation

For detailed installation and usage instructions, please visit our [documentation](https://markdown-confluence.com/).

## Contributing

Contributions are welcome! If you have a feature request, bug report, or want to improve the plugin, please open an issue or submit a pull request on the GitHub repository.

### Setting Up Your Development Environment

To start contributing to this project, follow these steps to set up your local development environment:

#### Prerequisites

- **Node.js**: Version 16.x or higher (the CI uses Node 16.x)
- **npm**: Version 7.x or higher
- **Git**: For version control

#### Getting Started

1. **Fork and Clone the Repository**

   ```bash
   git clone https://github.com/YOUR-USERNAME/markdown-confluence.git
   cd markdown-confluence
   ```

2. **Install Dependencies**

   This is a monorepo using npm workspaces. Install all dependencies with:

   ```bash
   npm ci
   ```

3. **Build the Project**

   Build all packages in the workspace:

   ```bash
   npm run build
   ```

#### Development Workflow

This monorepo contains multiple packages in the `packages/` directory:

- `@markdown-confluence/lib` - Core library
- `@markdown-confluence/mermaid-electron-renderer` - Mermaid diagram renderer for Electron
- `@markdown-confluence/mermaid-puppeteer-renderer` - Mermaid diagram renderer for Puppeteer
- `cli` - Command-line interface
- `obsidian` - Obsidian plugin

##### Common Commands

- **Build all packages**: `npm run build`
- **Run tests**: `npm test`
- **Format code**: `npm run fmt`
- **Lint code**: `npm run lint -ws --if-present`
- **Check formatting**: `npm run prettier-check -ws --if-present`

##### Developing the Obsidian Plugin

To develop the Obsidian plugin with live reload:

```bash
npm run dev-obsidian
```

This command will build the project and then watch for changes in the lib, mermaid-electron-renderer, and obsidian packages.

#### Code Quality

Before submitting a pull request:

1. **Add tests** for new features and bug fixes
2. **Follow the existing code style**
3. **Run the formatter**: `npm run fmt`
4. **Ensure tests pass**: `npm test`
5. **Verify the build**: `npm run build`

The project uses:

- **Husky** for Git hooks
- **lint-staged** for pre-commit formatting
- **Prettier** for code formatting
- **ESLint** for linting
- **Conventional Commits** for commit messages

#### Pull Request Process

1. Create a new branch for your feature or fix
2. Make your changes and commit using [Conventional Commits](https://conventionalcommits.org) format
3. Push your branch and open a pull request against the `main` branch
4. Ensure all CI checks pass (ESLint, Prettier, tests, build)
5. Wait for review and address any feedback

For bigger changes, please start a discussion first by creating an issue and explaining the intended change.

#### Contributor License Agreement

Atlassian requires contributors to sign a Contributor License Agreement (CLA). Please sign the appropriate CLA before submitting your contribution:

- [CLA for corporate contributors](https://opensource.atlassian.com/corporate)
- [CLA for individuals](https://opensource.atlassian.com/individual)

For more details, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the [Apache 2.0](https://github.com/markdown-confluence/markdown-confluence/blob/main/LICENSE) License.

## Disclaimer

The Apache license is only applicable to the Obsidian Confluence Integration (“Integration“), not to any third parties' services, websites, content or platforms that this Integration may enable you to connect with.  In another word, there is no license granted to you by the above identified licensor(s) to access any third-party services, websites, content, or platforms.  You are solely responsible for obtaining licenses from such third parties to use and access their services and to comply with their license terms. Please do not disclose any passwords, credentials, or tokens to any third-party service in your contribution to this Obsidian Confluence Integration project.”
