# Prompt: remove unused images from Potted (run locally in Claude Code)

Paste everything below the line into Claude Code, from the repo root.

---

Remove image and audio files in `assets/` that nothing in the game uses. Work on a new branch, `cleanup/unused-assets`, and do not touch `main` directly. Do not rewrite git history and do not force-push.

1. **Find what is referenced.**
   - Collect every `require('...assets/...')` path and every other `assets/...` string in `src/**/*.js`, `App.js`, `imports.js`, `imports.web.js` and `app.json`.
   - Paths can contain spaces (for example `assets/hangingplants/Philodendron1 .png`), so match up to the closing quote, not up to the first space.
   - Check for dynamic requires such as template strings, `require(base + name)`, or `assets/<dir>/${...}`. If any exist, list them and keep every file in that folder.
   - Also keep anything referenced by `tools/` scripts that regenerate assets, unless I say otherwise.

2. **Find dead exports in `src/engine/assets.js`.**
   - An export is dead if its name appears nowhere else in `src/`. Remove those exports.
   - Be careful with multi-line objects and trailing `// comments` when cutting them.
   - After removing them, run step 1 again, because files they alone referenced are now unused.
   - Repeat until nothing new turns up.

3. **Show me the list before deleting.** Print the unused files grouped by folder, with sizes and the total. Wait for my OK.

4. **Delete with `git rm`**, in one commit per folder or logical group, each with a clear message.

5. **Verify the app still builds and runs.**
   - Run the web build or `npx expo export --platform web`. Any "Unable to resolve" error means a file was deleted by mistake. Restore it with `git checkout HEAD~1 -- <path>` and add it to a keep-list.
   - Open the main screens (main, loading, map, nursery, counter, bouquet table, market, journal, pet shop, rooms) and check that no picture is missing.

6. **Report.** List what was removed, the MB saved, anything kept because of a dynamic require, and anything that looked unused but that I should confirm. Push the branch and tell me. Do not merge it.

Rules:
- Never delete a file I haven't seen in the printed list.
- `.gitignore` is an allow-list, so you don't need to edit it for deletions. Leave folders that become empty as they are.
- If unsure whether a file is used, keep it and tell me.
