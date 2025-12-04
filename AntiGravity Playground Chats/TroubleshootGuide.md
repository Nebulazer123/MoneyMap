# Antigravity Troubleshooting Guide

## Debugging Tools

### 1. Send Problems to Agent
**What it does:** Automatically sends IDE errors/warnings to the agent for fixing.

**How to use:**
1. Open the **Problems** panel in the editor
2. Click **"Send all to Agent"**
3. The agent will analyze and attempt to fix all listed problems

**When to use:** When you have lint errors, type errors, or other IDE warnings you want fixed automatically.

---

### 2. Explain and Fix
**What it does:** Lets you hover over a specific error and ask the agent to explain and fix it.

**How to use:**
1. Hover over a red squiggly line or error in your code
2. Click **"Explain and fix"**
3. The agent will explain the issue and propose a solution

**When to use:** When you have a single error you want context on before fixing.

---

### 3. Send Terminal Output to Agent
**What it does:** Sends terminal errors or output directly to the agent for debugging.

**How to use:**
1. Select the error/output text in the terminal
2. Press `Cmd + L` (or `Ctrl + L`)
3. The agent will analyze the output and suggest fixes

**When to use:** When you encounter build errors, runtime errors, or confusing terminal output.

---

### 4. Artifacts for Verification
**What they are:** Proof of the agent's work (screenshots, videos, code diffs, test results).

**Types of artifacts:**
- **Task Plans:** What the agent plans to do
- **Code Diffs:** Exact line-by-line changes
- **Screenshots:** Visual proof of UI changes
- **Browser Recordings:** Videos of browser interactions
- **Test Results:** Pass/fail logs from tests

**How to access:**
- Toggle artifacts view from the top-right in Agent Manager
- Review artifacts before approving changes

**When to use:** To verify the agent did what you asked before accepting changes.

---

## Security & Safety

### 5. Allow List (Whitelist)
**What it does:** Lets specific commands run automatically even in "Off" mode.

**How to configure:**
1. Go to **Settings** → **Terminal Command Auto Execution** → Set to **"Off"**
2. Click **"Add"** next to **Allow List Terminal Commands**
3. Add safe commands like `ls`, `git status`, `npm install`

**Testing:**
- Ask the agent to run a command in the allow list → Runs automatically
- Ask the agent to run a command **not** in the list → Asks for permission

**Note:** You may need to restart Antigravity for changes to take effect.

---

### 6. Deny List (Blacklist)
**What it does:** Blocks specific commands from auto-running even in "Turbo" mode.

**How to configure:**
1. Go to **Settings** → **Terminal Command Auto Execution** → Set to **"Turbo"**
2. Click **"Add"** next to **Deny List Terminal Commands**
3. Add dangerous commands like `rm`, `rmdir`, `sudo`, `curl`, `wget`

**Testing:**
- Ask the agent to run a safe command → Runs automatically
- Ask the agent to run a denied command → Asks for permission

**Note:** You may need to restart Antigravity for changes to take effect.

---

### 7. Browser URL Allowlist
**What it does:** Restricts which websites the agent can browse to prevent prompt injection attacks.

**How to configure:**
1. Go to **Antigravity** → **Settings** → **Advanced Settings**
2. Find **Browser URL Allowlist**
3. Click **"Open Allowlist File"**
4. Edit `~/.gemini/antigravity/browserAllowlist.txt` to include only trusted domains

**When to use:** When you want to limit the agent to browsing only trusted documentation sites.

---

## Useful Shortcuts

### Editor Shortcuts
- **Toggle Terminal:** `` Ctrl + ` ``
- **Toggle Agent Panel:** `Cmd + L` (or `Ctrl + L`)
- **Inline AI Completion:** `Cmd + I` (or `Ctrl + I`)
- **Switch to Agent Manager:** `Cmd + E` (or `Ctrl + E`)

### Agent Panel Features
- **Include Context:** Type `@` to include files, directories, or MCP servers
- **Run Workflow:** Type `/` to trigger a saved workflow (e.g., `/turbo`)
- **Conversation Modes:**
  - **Fast:** Quick tasks
  - **Planning:** Complex tasks requiring a reviewable plan

---

## Common Issues

### Agent Not Auto-Running Commands
**Possible causes:**
- Execution policy is set to "Off"
- Command is not in the Allow List (if using "Off" mode)
- Command is in the Deny List (if using "Turbo" mode)

**Solution:**
- Check **Settings** → **Terminal Command Auto Execution**
- Add safe commands to Allow List OR remove from Deny List
- Restart Antigravity after making changes

---

### Changes Not Taking Effect
**Possible causes:**
- Rules/workflows not saved in the correct location
- Antigravity hasn't reloaded the config

**Solution:**
- Ensure files are in `.agent/rules/` or `.agent/workflows/` for workspace-specific
- Ensure files are in `~/.gemini/GEMINI.md` or `~/.gemini/antigravity/global_workflows/` for global
- Restart Antigravity if changes don't appear immediately

---

### Agent Asking for Permission Too Often
**Possible causes:**
- Review policy is set to "Request Review"
- Execution policy is set to "Off" or "Auto"

**Solution:**
- Use "Agent Decides" for Review Policy (recommended balance)
- Use "Turbo" for Execution Policy (with a well-configured Deny List)
- Create a `/turbo` workflow for specific tasks requiring auto-approval

---

## File Locations Reference
- **Global Settings:** `C:\Users\Corbin\.gemini\GEMINI.md`
- **Global Workflows:** `C:\Users\Corbin\.gemini\antigravity\global_workflows\`
- **Browser Allowlist:** `C:\Users\Corbin\.gemini\antigravity\browserAllowlist.txt`
- **Workspace Rules:** `[Workspace Root]\.agent\rules\`
- **Workspace Workflows:** `[Workspace Root]\.agent\workflows\`
