#!/bin/sh

set -e

if [ "$DJANGO_SERVICE" = "web" ]; then

  python manage.py makemigrations --noinput
  python manage.py migrate --noinput
  python manage.py collectstatic --noinput
fi

exec "$@"
