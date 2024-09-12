import os
import re
from django.db import models

COUNTRY_CHOICES = [
    ('MLD', 'Moldova'),
    ('UKR', 'Ukraine'),
]


class SurrogacyMother(models.Model):
    name = models.CharField(max_length=255)
    country_selection = models.CharField(max_length=3, choices=COUNTRY_CHOICES, default='MLD')
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Date(models.Model):
    surrogacy = models.ForeignKey(SurrogacyMother, on_delete=models.CASCADE, related_name='choose_dates')
    entry = models.DateField()
    exit = models.DateField()
    country = models.CharField(max_length=3, choices=COUNTRY_CHOICES)
    disable = models.BooleanField(default=False)

    def __str__(self):
        return f"Date instance for {self.surrogacy.name}"

    def save(self, *args, **kwargs):
        # save country related to mother instance
        if not self.pk:
            self.country = self.surrogacy.country_selection
        super().save(*args, **kwargs)


class Ukraine(SurrogacyMother):
    class Meta:
        proxy = True
        verbose_name = 'Ukraine'
        verbose_name_plural = 'Ukraine'

    def __str__(self):
        return self.name


class Moldova(SurrogacyMother):
    class Meta:
        proxy = True
        verbose_name = 'Moldova'
        verbose_name_plural = 'Moldova'

    def __str__(self):
        return self.name


def clean_filepath(filename):
    # Define a regular expression pattern to match prohibited characters, including apostrophes
    prohibited_characters = r'[\\/*?:"<>|\'`]'
    # Replace prohibited characters with an empty string
    cleaned_filename = re.sub(prohibited_characters, '', filename)
    return cleaned_filename


def directory_path(instance, filename):
    return f'{clean_filepath(instance.mother.name)}/{filename}'


class Document(models.Model):
    mother = models.OneToOneField(SurrogacyMother, on_delete=models.CASCADE)
    title = models.CharField(max_length=250)
    created = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to=directory_path)

    def __str__(self):
        # if self is None must return '' because if add new document from inline without '' the error raise
        return str(self.title).title() if self.title else ''

    def delete(self, *args, **kwargs):
        # Delete the associated file from the filesystem
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)
        # Call the superclass delete method
        super().delete(*args, **kwargs)


class Message(models.Model):
    chat_id = models.CharField(max_length=255)
    message_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message {self.message_id} in Chat {self.chat_id}"

    class Meta:
        unique_together = ('chat_id', 'message_id')


