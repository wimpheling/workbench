# Development tasks

Track development work as Markdown files in these three folders:

- `todo/`: drafted tasks whose scope and approach are being discussed.
- `in-progress/`: tasks being implemented and verified.
- `done/`: completed tasks with every checkbox checked.

Use a short, descriptive kebab-case filename. Keep the same filename when
moving a task between folders so its history remains easy to follow.

## Workflow

1. Draft the task in `todo/` before starting implementation. Describe the
   intended outcome, record the discussion, propose an implementation plan,
   and capture open questions or blockers.
2. Move the file to `in-progress/` when work starts. Update the discussion and
   plan as decisions or discoveries change the work. Check boxes as their
   outcomes are achieved, including the relevant verification evidence.
3. Resolve open questions and blockers in the task itself. Record the answer
   or resolution before checking its box. A blocked task stays in
   `in-progress/`; elapsed time does not resolve a blocker.
4. Move the task to `done/` only when the intended outcome is delivered and
   every checkbox is checked. If work is deliberately removed from scope,
   record why; if deferred, link a new task in `todo/`. Do not mark unfinished
   implementation as completed.

## Required contents and formatting

Each task has a title and the sections **Description**, **Discussion**,
**Implementation plan**, and **Open questions / blockers**.

Description and Discussion may use ordinary prose. Inside Implementation plan
and Open questions / blockers, use Markdown checkboxes for every item,
including phase titles, subitems, and lists. Use nested checkboxes for
hierarchy rather than additional headings or ordinary bullets. The section
headings themselves remain Markdown headings.

Use `- [ ]` for pending work and `- [x]` for completed work or resolved
questions. Check a parent item only when all its children are complete.
When no questions or blockers remain, an explicit checked item may say so.

## Task template

```markdown
# Short task title

## Description

Describe the problem, intended outcome, and scope.

## Discussion

Record relevant context, decisions, and reasons as the task evolves.

## Implementation plan

- [ ] Deliver the intended behavior
  - [ ] Implement the concrete change
  - [ ] Verify the outcome with appropriate checks
  - [ ] Record results and update relevant documentation

## Open questions / blockers

- [ ] State a question or blocker; append its resolution before checking it
```
