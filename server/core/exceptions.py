from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    return Response(
        {
            'error': {
                'code': _get_code(response.status_code),
                'message': _get_message(response.data),
                'details': response.data if isinstance(response.data, dict) else {},
            }
        },
        status=response.status_code,
    )


def _get_code(status_code):
    codes = {
        400: 'VALIDATION_ERROR',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        429: 'RATE_LIMITED',
        500: 'SERVER_ERROR',
    }
    return codes.get(status_code, 'ERROR')


def _get_message(data):
    if isinstance(data, dict) and 'detail' in data:
        return str(data['detail'])
    if isinstance(data, list) and data:
        return str(data[0])
    return 'An error occurred.'
