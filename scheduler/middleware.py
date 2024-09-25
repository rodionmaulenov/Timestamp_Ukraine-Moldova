class RemoveCOOPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        # Remove or modify COOP header
        response.headers.pop('Cross-Origin-Opener-Policy', None)
        return response