from django import template

register = template.Library()


@register.filter
def split_path(value):
    """
    Splits the request path and returns a list of segments.
    Example: '/admin/schedule/moldova/' -> ['admin', 'schedule', 'moldova']
    """
    return value.strip('/').split('/')
