FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/


RUN apt-get update && \
    pip install --root-user-action=ignore --upgrade pip && \
    pip install --root-user-action=ignore -r requirements.txt

COPY . /usr/src/app/

RUN adduser --disabled-password --gecos "" --no-create-home customuser && \
    chown -R customuser:customuser /usr/src/app && \
    chmod -R 775 /usr/src/app \

USER customuser

