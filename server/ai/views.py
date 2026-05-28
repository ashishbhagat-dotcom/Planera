from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import AIService


class AISuggestView(APIView):
    permission_classes = [IsAuthenticated]

    ALLOWED_ACTIONS = ('improve_description', 'generate_subtasks', 'estimate_effort')

    def post(self, request):
        action = request.data.get('action')
        if action not in self.ALLOWED_ACTIONS:
            return Response({'error': 'Invalid action'}, status=400)
        if not getattr(settings, 'GEMINI_API_KEY', ''):
            return Response({'error': 'AI not configured'}, status=503)

        context = request.data.get('context', {})
        try:
            result = AIService.run(action=action, context=context)
        except Exception as e:
            msg = str(e)
            if '429' in msg or 'quota' in msg.lower() or 'rate' in msg.lower():
                return Response({'error': 'Rate limit reached. Please wait a moment and try again.'}, status=429)
            return Response({'error': msg}, status=500)

        return Response({'result': result})
