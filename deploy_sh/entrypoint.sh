#!/bin/sh

set -e

if [ "$DJANGO_SERVICE" = "web" ]; then

  python manage.py makemigrations
  python manage.py migrate
  python manage.py collectstatic --noinput
fi

exec "$@"
