import logging

from asgiref.sync import async_to_sync
from celery import shared_task
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)


def broadcast_board_update(project_key: str, event_type: str, payload: dict):
    """Called directly from on_commit — no Celery queue, fires immediately."""
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'board_{project_key}',
            {
                'type': 'board.event',
                'data': {
                    'type': event_type,
                    **payload,
                },
            },
        )
    except Exception:
        logger.exception('broadcast_board_update failed for %s %s', project_key, event_type)


@shared_task(name='issues.broadcast_board_update_task')
def broadcast_board_update_task(project_key: str, event_type: str, payload: dict):
    """Celery-backed version — kept for future use (e.g. fanout across workers)."""
    broadcast_board_update(project_key, event_type, payload)
