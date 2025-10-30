# Confluence Macro Support

This document explains how to use Confluence macros in your Markdown files when publishing to Confluence.

## Current Status

As of version 5.5.2, the markdown-confluence tools **do not automatically convert** Confluence macro syntax (e.g., `{toc:printable=true}`) from Markdown. However, you can include any Confluence macro by embedding raw ADF (Atlassian Document Format) JSON in your Markdown files.

## How to Use Macros

### Method: ADF Code Blocks

You can embed any Confluence macro by using a code block with the language identifier `adf` and including the raw ADF JSON representation of the macro.

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "toc",
    "parameters": {
      "macroParams": {
        "printable": {
          "value": "true"
        }
      }
    }
  }
}
```
````

## Common Macro Examples

### Table of Contents (TOC)

Basic TOC:

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "toc",
    "parameters": {
      "macroParams": {}
    }
  }
}
```
````

TOC with printable option:

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "toc",
    "parameters": {
      "macroParams": {
        "printable": {
          "value": "true"
        }
      }
    }
  }
}
```
````

TOC with additional options:

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "toc",
    "parameters": {
      "macroParams": {
        "printable": {
          "value": "true"
        },
        "maxLevel": {
          "value": "3"
        },
        "minLevel": {
          "value": "1"
        },
        "outline": {
          "value": "true"
        }
      }
    }
  }
}
```
````

### Info Panel

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "info",
    "parameters": {
      "macroParams": {
        "title": {
          "value": "Important Information"
        }
      }
    }
  }
}
```
````

### Warning Panel

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "warning",
    "parameters": {
      "macroParams": {
        "title": {
          "value": "Warning"
        }
      }
    }
  }
}
```
````

### Note Panel

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "note",
    "parameters": {
      "macroParams": {
        "title": {
          "value": "Note"
        }
      }
    }
  }
}
```
````

### Page Tree

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "pagetree",
    "parameters": {
      "macroParams": {
        "root": {
          "value": "@self"
        },
        "startDepth": {
          "value": "1"
        },
        "sort": {
          "value": "natural"
        },
        "searchBox": {
          "value": "true"
        }
      }
    }
  }
}
```
````

### Expand Macro

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "expand",
    "parameters": {
      "macroParams": {
        "title": {
          "value": "Click to expand"
        }
      }
    }
  }
}
```
````

### Code Block (Syntax Highlighting)

````markdown
```adf
{
  "type": "extension",
  "attrs": {
    "extensionType": "com.atlassian.confluence.macro.core",
    "extensionKey": "code",
    "parameters": {
      "macroParams": {
        "language": {
          "value": "javascript"
        },
        "title": {
          "value": "Example Code"
        },
        "linenumbers": {
          "value": "true"
        }
      }
    }
  }
}
```
````

## Finding ADF JSON for Other Macros

To find the ADF JSON representation for other Confluence macros:

1. Create a page in Confluence with the macro you want to use
2. Use the Confluence REST API to retrieve the page content in ADF format:
   ```bash
   curl -u email@example.com:api_token \
     "https://your-domain.atlassian.net/wiki/rest/api/content/PAGE_ID?expand=body.atlas_doc_format" \
     | jq '.body.atlas_doc_format.value'
   ```
3. Extract the macro's ADF JSON from the response
4. Use it in your Markdown file within an `adf` code block

## Alternative: Callouts (Built-in Support)

For simple panels/callouts, you can use the built-in callout syntax which is automatically converted:

```markdown
> [!info] Information
> This is an info callout

> [!warning] Warning
> This is a warning

> [!note] Note
> This is a note
```

## Future Enhancements

We are considering adding automatic conversion of common Confluence macro syntax in future versions. If you have specific macro needs, please open an issue on GitHub with your use case.

## Related Issues

- Issue #667: Status of macro support
- Discussion #297: Confluence macro support

## See Also

- [Atlassian Document Format (ADF) Documentation](https://developer.atlassian.com/cloud/jira/platform/apis/document/structure/)
- [Confluence Cloud REST API](https://developer.atlassian.com/cloud/confluence/rest/v1/intro/)
