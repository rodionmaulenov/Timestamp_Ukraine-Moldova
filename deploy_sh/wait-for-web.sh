#!/bin/sh

# Wait for the web service to be ready
echo "Waiting for the web service to be ready..."

while ! nc -z web 8000; do
  echo "Waiting for the web service to be ready..."
  sleep 10
done

echo "Web service is up and running!"
exec "$@"
