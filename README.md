# claude-code-md-viewer-gbvdm

[Português (Brasil)](README.pt-BR.md)

A Markdown viewer for [Claude Code](https://code.claude.com/docs/en/overview) that **renders Mermaid diagrams**. The Files pane of the Claude desktop app (Code tab) shows ` ```mermaid ` blocks as code; this plugin opens the same file in the app's Browser pane with the diagrams rendered.

The page shows:

- the document, with tables, `<details>` blocks and any HTML the `.md` itself contains;
- every ` ```mermaid ` block rendered, in a dark theme, at the width of the reading area (a click on the diagram switches to its natural size, with horizontal scrolling);
- in place of a diagram with a syntax error, Mermaid's message with the line and the reason;
- on the left, the folders and `.md` files of the document's folder, to open another file with one click;
- links between documents (`other.md#section`) that open the other document at the section, even inside a closed `<details>`;
- the file again, by itself, within 2 seconds of a saved change.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer.
- The Claude desktop app, Code tab, to open it in the Browser pane. Elsewhere (terminal, editor extension) the plugin gives you a URL to open in a browser.
- Internet: the page loads `marked`, `DOMPurify` and `mermaid` from `cdn.jsdelivr.net`. The content of your files is not sent anywhere.

## Install

In a terminal, with Claude Code's `claude` command:

```bash
claude plugin marketplace add guilhermebvdm/claude-code-md-viewer-gbvdm
```

```bash
claude plugin install md-viewer@gbvdm-md-viewer
```

Then start a new session in the app.

## Use

### 1. Open a file in a session

Ask Claude, with the path or part of the name:

```text
/md-viewer:view docs/specs/payloads.md
```

or in plain words: "open payloads.md in the viewer". With no path (`/md-viewer:view`), the page opens on the session's folder, with the file list.

Claude runs one command that starts the viewer's server when it is not running, and opens the Browser pane on the file.

### 2. Once it is open, without asking Claude

- click another `.md` or folder in the list on the left ("List" hides and shows it);
- click the links in the document;
- type another path, of a `.md` file or a folder, in the field at the top and press Enter;
- edit the file in any editor: the page reloads by itself.

### 3. Starting from the app's Files pane

The app does not let a plugin add items to the Files pane's right-click menu, so there is no "Open with md-viewer" there. The shortest path:

1. right-click the file, **Copy path**;
2. in the prompt box: `/md-viewer:view ` and paste the path.

If the viewer is already open in the Browser pane, paste the path in the field at the top of the page instead: no need to go through Claude.

### Without Claude

From a clone of this repository:

```bash
node server/serve.js --ensure "/path/to/file.md"
```

It prints the page's URL; open it in any browser.

## The server

- Runs on `http://localhost:4317`. Set the `MD_VIEWER_PORT` environment variable for another port.
- Keeps running after the session ends, and the next session reuses it. To stop it: `node server/serve.js --stop`, or ask Claude to stop the viewer.
- After a plugin update, the next `--ensure` stops the old version's server and starts the new one.

## What the server accesses

Read this before installing: it is code that runs with your permissions.

- It **reads** `.md` files and images (`.png`, `.jpg`, `.gif`, `.webp`, `.svg`) and **lists** folders, in any folder of the computer the page asks for. Folders starting with `.` and `node_modules` are left out of the list.
- It **writes** nothing to disk.
- It **accepts connections from this machine only** (`127.0.0.1`) and answers only requests addressed to `localhost`, which blocks a page on another site from reaching it under another name.
- Each document's HTML goes through DOMPurify before it is shown, which removes scripts and attributes such as `onerror` from a `.md` of unknown origin.

## Known limits

- A very wide diagram fitted to the width has small text: click it to see its natural size.
- A small diagram grows up to 1.5 times its natural size, and does not take the whole width.
- Without internet, diagrams are not shown.
- Files other than `.md` do not open.

## License

[MIT](LICENSE)
