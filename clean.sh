#!/bin/sh

docker rm -f $(docker ps -aq)
docker rmi $(docker images -q) --force
docker volume rm $(docker volume ls -q | grep -v -e 'timestamp_ukraine-moldova_migrations_data' -e 'timestamp_ukraine-moldova_postgres_data') --force
