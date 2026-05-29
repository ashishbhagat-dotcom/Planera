import json
from groq import Groq
from django.conf import settings
from .prompts import IMPROVE_DESCRIPTION_PROMPT, GENERATE_SUBTASKS_PROMPT, ESTIMATE_EFFORT_PROMPT

_GROQ_MODEL = 'llama-3.3-70b-versatile'


def _call_groq(prompt: str) -> str:
    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        model=_GROQ_MODEL,
        messages=[{'role': 'user', 'content': prompt}],
        max_tokens=1024,
    )
    return response.choices[0].message.content


def _strip_code_fences(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith('```'):
        parts = raw.split('```')
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith('json'):
            raw = raw[4:]
    return raw.strip()


class AIService:
    @staticmethod
    def improve_description(title: str, description: str) -> str:
        prompt = IMPROVE_DESCRIPTION_PROMPT.format(title=title, description=description or '(no description)')
        return _call_groq(prompt)

    @staticmethod
    def generate_subtasks(title: str, description: str) -> list[str]:
        prompt = GENERATE_SUBTASKS_PROMPT.format(title=title, description=description or '(no description)')
        raw = _strip_code_fences(_call_groq(prompt))
        try:
            result = json.loads(raw)
            if isinstance(result, list):
                return [str(s) for s in result[:5]]
        except (json.JSONDecodeError, ValueError):
            pass
        return []

    @staticmethod
    def estimate_effort(title: str, description: str) -> dict:
        prompt = ESTIMATE_EFFORT_PROMPT.format(title=title, description=description or '(no description)')
        raw = _strip_code_fences(_call_groq(prompt))
        try:
            result = json.loads(raw)
            return {
                'story_points': result.get('story_points', 3),
                'priority': result.get('priority', 'medium'),
                'reasoning': result.get('reasoning', ''),
            }
        except (json.JSONDecodeError, ValueError):
            return {'story_points': 3, 'priority': 'medium', 'reasoning': 'Unable to parse estimate.'}

    @staticmethod
    def run(action: str, context: dict) -> object:
        title = context.get('title', '')
        description = context.get('description', '')
        if action == 'improve_description':
            return AIService.improve_description(title, description)
        if action == 'generate_subtasks':
            return AIService.generate_subtasks(title, description)
        if action == 'estimate_effort':
            return AIService.estimate_effort(title, description)
        raise ValueError(f'Unknown action: {action}')
