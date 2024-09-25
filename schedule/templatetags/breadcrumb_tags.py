from django import template

register = template.Library()


@register.simple_tag
def generate_breadcrumbs(request):
    breadcrumb_list = [{'name': 'Home', 'url': '/admin'}]

    path = request.path.strip('/').split('/')

    accumulated_path = '/admin'
    for segment in path[1:]:
        if segment.isdigit():
            continue

        accumulated_path += f'/{segment}'
        breadcrumb_list.append({
            'name': segment.capitalize(),
            'url': accumulated_path
        })

    return breadcrumb_list
