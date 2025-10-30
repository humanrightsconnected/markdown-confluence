# @markdown-confluence/cli

`@markdown-confluence/cli` is a powerful tool that allows you to publish your markdown files as Confluence pages. It is designed to work seamlessly in various environments, including NPM CLI, Docker Container, and GitHub Actions, enabling you to use your docs wherever you need them. Comprehensive documentation for the tool can be found at [https://markdown-confluence.com/](https://markdown-confluence.com/).

## Usage Examples

### CLI

**Example setup**

`.markdown-confluence.json`:

```json
{
  "confluenceBaseUrl": "https://markdown-confluence.atlassian.net",
  "confluenceParentId": "524353",
  "atlassianUserName": "andrew.mcclenaghan@gmail.com",
  "folderToPublish": "."
}
```

**Environment Variables**

macOS / Linux:

```bash
export ATLASSIAN_API_TOKEN="YOUR API TOKEN"
```

Windows:

```bash
set ATLASSIAN_API_TOKEN="YOUR API TOKEN"
```

[Learn more about `set` command](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/set_1)

**CLI Command**

```bash
npx @markdown-confluence/cli
```

### Docker Container

**Example setup**
```bash
docker run -it --rm -v "$(pwd):/content" -e ATLASSIAN_API_TOKEN ghcr.io/markdown-confluence/publish:latest
```

### GitHub Actions

**Example setup**

`.github/workflows/publish.yml`:

```yaml
name: Publish to Confluence
on: [push]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      - name: Publish Markdown to Confluence
        uses: markdown-confluence/publish@v1
        with:
          atlassianApiToken: ${{ secrets.ATLASSIAN_API_TOKEN }}
```

**Environment Variables**

Add your API token as a secret in your GitHub repository settings:

1. Go to your repository's `Settings` tab.
2. Click on `Secrets` in the left sidebar.
3. Click on `New repository secret`.
4. Name it `ATLASSIAN_API_TOKEN` and enter your API token as the value.
5. Click on `Add secret`.

## Configuration Parameters

### Understanding `folderToPublish` vs `contentRoot`

These two parameters work together to control which files are published to Confluence:

#### `contentRoot` (Base Search Directory)

- **Purpose**: Defines the root directory where the tool searches for ALL markdown files
- **Default**: Current working directory (`process.cwd()`)
- **Configuration**: Set via `contentRoot` in config file or `CONFLUENCE_CONTENT_ROOT` environment variable
- **Use case**: When your markdown files are in a subdirectory of your project

**Example**:
```json
{
  "contentRoot": "/path/to/my-project/docs",
  "folderToPublish": "confluence"
}
```

#### `folderToPublish` (Publish Filter)

- **Purpose**: Filters which files within `contentRoot` should be published
- **Default**: `"Confluence Pages"`
- **Special value**: `"."` means publish ALL files in `contentRoot`
- **Configuration**: Set via `folderToPublish` in config file or `FOLDER_TO_PUBLISH` environment variable
- **Use case**: When you only want to publish files from a specific subfolder

**Example**:
```json
{
  "folderToPublish": "confluence"
}
```

### How They Work Together

The tool follows this process:

1. **Search**: Recursively find all markdown files starting from `contentRoot`
2. **Filter**: Only keep files whose path starts with `folderToPublish` (relative to `contentRoot`)
3. **Publish**: Upload the filtered files to Confluence

### Common Scenarios

#### Scenario 1: Publish everything in current directory
```json
{
  "folderToPublish": "."
}
```
- Searches from current directory
- Publishes all markdown files found

#### Scenario 2: Publish from specific folder
```json
{
  "folderToPublish": "confluence-docs"
}
```
- Searches from current directory
- Only publishes files in `./confluence-docs/` and its subdirectories

#### Scenario 3: Different search and publish locations
```json
{
  "contentRoot": "/project/documentation",
  "folderToPublish": "public"
}
```
- Searches from `/project/documentation`
- Only publishes files in `/project/documentation/public/` and subdirectories

#### Scenario 4: Monorepo with docs in subdirectory
```json
{
  "contentRoot": "packages/docs",
  "folderToPublish": "."
}
```
- Searches from `./packages/docs`
- Publishes all markdown files in `./packages/docs` and subdirectories

### When Would They Differ?

You would set both parameters differently when:

1. **Your markdown files are not in the project root**: Use `contentRoot` to point to the docs directory
2. **You want to publish only a subset of docs**: Use `folderToPublish` to filter to a specific subfolder
3. **GitHub Actions with docs in subdirectory**: Set `contentRoot` to the docs location to optimize search
4. **Monorepo setup**: Each package might have its own docs, use `contentRoot` to target the right package

### Override with Frontmatter

Individual files can override the `folderToPublish` filter using frontmatter:

```markdown
---
connie-publish: true
---

# This file will be published even if not in folderToPublish
```

Similarly, files can be excluded:

```markdown
---
connie-publish: false
---

# This file will NOT be published even if in folderToPublish
```