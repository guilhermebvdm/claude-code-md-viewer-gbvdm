---
name: view
description: Opens a Markdown (.md) file or a folder of Markdown files in md-viewer, a local viewer that shows the document with its Mermaid diagrams rendered, in the Claude desktop app's Browser pane. Use when the user asks to open, view, preview or read a .md file "in the viewer", "with the diagrams", "rendered", or asks to see Mermaid diagrams of a document; in Portuguese, "abrir no visualizador", "ver o md com os diagramas".
argument-hint: "[file.md or folder]"
---

# Open a Markdown file in md-viewer

The viewer is a small local web server shipped with this plugin. You start it if it is not running, get the URL for the file, and open that URL in the Browser pane. Do not read the Markdown file yourself: the viewer reads it.

## 1. Find the target

The target is `$ARGUMENTS`: a `.md` file or a folder, absolute or relative to the session's working directory.

- Empty: use the session's working directory. The viewer lists its folders and `.md` files.
- A partial name ("the payloads doc", `05-fluxos`): find the file with Glob first. If several files match, ask which one.

## 2. Start the server and get the URL

Run this one command with the Bash tool, with the target as an absolute path, quoted:

```bash
node "${CLAUDE_PLUGIN_ROOT}/server/serve.js" --ensure "<absolute path of the target>"
```

It starts the server in the background when it is not running (port 4317, or the `MD_VIEWER_PORT` environment variable), waits for it, and prints one line: the URL that opens the target. The server keeps running after the session ends, so the next session reuses it.

If it prints an error instead, tell the user what it says. "Port 4317 is used by another program" means the user has to set `MD_VIEWER_PORT` to a free port.

## 3. Open the URL

- In the Claude desktop app: call `preview_start` with the `url` the command printed. If a Browser pane tab already shows md-viewer (`tabs_context` lists an origin `http://localhost:4317`), call `navigate` on that tab instead.
- Anywhere else (terminal CLI, editor extension): give the user the URL to open in their browser.

Then tell the user, in one or two lines, that the file is open and that they can:

- search the document with `Ctrl+F`, and filter the file list with `Ctrl+P`;
- zoom the document with `Ctrl` + mouse wheel (`Ctrl+0` resets it);
- click the `.md` files and folders in the list on the left to open others, without asking you;
- edit the file: the page reloads within 2 seconds of a save.

## Stopping the server

Only when the user asks: `node "${CLAUDE_PLUGIN_ROOT}/server/serve.js" --stop`.
