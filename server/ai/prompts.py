IMPROVE_DESCRIPTION_PROMPT = """You are a technical product manager. Rewrite the following issue description into a clear, structured spec.

Format your output as:
**Problem**: (1-2 sentences describing what's broken or missing)
**Expected behavior**: (what should happen)
**Acceptance criteria**:
- [ ] criterion 1
- [ ] criterion 2
**Notes**: (optional — edge cases, dependencies)

Issue title: {title}
Current description: {description}

Respond with only the rewritten description. No preamble."""

GENERATE_SUBTASKS_PROMPT = """You are a senior engineer breaking down a task into sub-tasks.

Given the issue below, generate 3-5 concrete, actionable sub-tasks.
Each sub-task should be a single clear sentence, starting with a verb.

Issue title: {title}
Description: {description}

Respond with a JSON array of strings: ["Sub-task 1", "Sub-task 2", ...]"""

ESTIMATE_EFFORT_PROMPT = """You are an experienced software engineer. Estimate the story points and priority for this issue.

Respond with JSON only:
{{"story_points": <1|2|3|5|8|13>, "priority": <"urgent"|"high"|"medium"|"low">, "reasoning": "<one sentence>"}}

Issue title: {title}
Description: {description}"""
