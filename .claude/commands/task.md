---
description: Create or work on a specific task in TASKS.md
---

# Task Management

You are working with tasks in TASKS.md. This command helps you create new tasks or work on specific existing tasks.

## User Input

```text
$ARGUMENTS
```

## Instructions

### 1. Check if TASKS.md exists

First, check if TASKS.md exists in the repository root.

- **If it doesn't exist**: Create it with a basic structure (see Task File Structure below)
- **If it exists**: Read it to understand the current task list

### 2. Process User Arguments

The user's input can be one of the following:

**A. No arguments** (user just typed `/task`)

- Display all current tasks
- Show summary: total tasks, completed, remaining
- Ask what they want to do: create new task, work on existing task, or use `/tasks.resume`

**B. Task description** (user typed `/task Fix the login bug`)

- Add this as a new task to TASKS.md under the "Current Sprint" section
- Use format: `- [ ] Fix the login bug`
- Confirm the task was added
- Ask if they want to start working on it immediately

**C. Task number** (user typed `/task 3` or `/task #3`)

- Find task #3 in the list
- Display the task details
- Ask if they want to start working on it
- If yes, use TodoWrite tool to track subtasks

### 3. Working on a Task

When working on a task:

1. **Mark as in progress**: Add a 🔄 emoji or timestamp
2. **Use TodoWrite**: Break down complex tasks into subtasks for tracking
3. **Complete the work**: Perform the actual task
4. **Update TASKS.md**: Mark as done when finished `- [x] Task description`
5. **Ask about next steps**: Should we move to the next task?

### 4. Task File Structure

If creating TASKS.md for the first time, use this structure:

```markdown
# Project Tasks

> Last updated: [Current Date]

## Current Sprint

<!-- Active tasks for the current work session -->

- [ ] Example task 1
- [ ] Example task 2

## Backlog

<!-- Future tasks, not currently prioritized -->

- [ ] Future task

## Completed

<!-- Completed tasks for reference -->

- [x] Completed task 1 - [completion date]
```

### 5. Task Format Guidelines

- Use simple checkbox format: `- [ ]` for incomplete, `- [x]` for complete
- Keep descriptions clear and actionable
- Include file paths or locations when relevant
- Example: `- [ ] Add validation to src/actions/projects.ts`
- Can add priority markers: `- [ ] [P1] Critical bug fix`
- Can add tags: `- [ ] Fix auth bug #security #urgent`

## Important

- TASKS.md is git-ignored, so it's private to your local work
- Keep tasks focused and specific
- Break down large tasks into smaller, manageable ones
- Update the "Last updated" timestamp when modifying TASKS.md
- Move completed tasks to the "Completed" section periodically

## Examples

### Create a new task:

```
User: /task Add error logging to server actions
You: I'll add this task to TASKS.md. [Creates task] Would you like to start working on it now?
```

### Work on existing task:

```
User: /task 2
You: Task #2: "Add validation to projects.ts"
     This task involves adding Zod validation. Shall I begin?
```

### List all tasks:

```
User: /task
You: Current tasks in TASKS.md:
     - 3 remaining tasks
     - 5 completed tasks
     [Shows list of remaining tasks]
```
