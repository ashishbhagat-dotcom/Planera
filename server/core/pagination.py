from rest_framework.pagination import CursorPagination as _BaseCursorPagination


class CursorPagination(_BaseCursorPagination):
    page_size = 50
    ordering = '-created_at'
