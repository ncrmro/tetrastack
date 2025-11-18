---
description: Resume working on tasks from TASKS.md
---

# Resume Tasks

You are resuming work on tasks from TASKS.md. This command helps you continue working on your task list.

## Instructions

1. **Read TASKS.md**: First, check if TASKS.md exists in the repository root. If it doesn't exist, inform the user that there are no tasks to resume and suggest using `/task` to create a new task.

2. **Find Next Task**: Look for the first unchecked task (lines starting with `- [ ]`) in TASKS.md. Tasks are in the format:

   ```
   - [ ] Task description
   - [x] Completed task
   ```

3. **Display Context**: Show the user:
   - The next task to work on
   - How many tasks are remaining
   - How many tasks are completed
   - Any relevant context from surrounding tasks

4. **Ask for Confirmation**: Ask the user if they want to:
   - Start working on the next task
   - Skip to a different task
   - View all remaining tasks
   - Add new tasks to the list

5. **Begin Work**: Once confirmed, start working on the selected task. Use the TodoWrite tool to track subtasks if the task is complex.

6. **Update TASKS.md**: When a task is completed:
   - Mark it as done by changing `- [ ]` to `- [x]`
   - Add a completion timestamp if appropriate
   - Move to the next task

## Task Format

Tasks in TASKS.md should follow this simple format:

```markdown
# Project Tasks

## Current Sprint

- [ ] Task description here
- [ ] Another task
- [x] Completed task

## Completed

- [x] Old completed task
```

## Important

- Always read TASKS.md before starting
- Keep the user informed of progress
- Ask before making major changes to the task list
- If TASKS.md doesn't exist, offer to create it with `/task`
