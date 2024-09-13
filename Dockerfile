FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/


RUN apt-get update && \
    pip install --root-user-action=ignore --upgrade pip && \
    pip install --root-user-action=ignore -r requirements.txt

COPY . /usr/src/app/

# Create a non-root user `celeryuser` with no password and add it to the app directory
RUN adduser --disabled-password --gecos "" --no-create-home customuser

# Switch to non-root user
USER customuser

