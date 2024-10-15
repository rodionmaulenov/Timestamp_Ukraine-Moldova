import os
import re
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

COUNTRY_CHOICES = [
    ('MLD', _('Moldova')),
    ('UKR', _('Ukraine')),
    ('UZB', _('Uzbekistan')),
]

def clean_filepath(filename):
    # Define a regular expression pattern to match prohibited characters, including apostrophes
    prohibited_characters = r'[\\/*?:"<>|\'`]'
    # Replace prohibited characters with an empty string
    cleaned_filename = re.sub(prohibited_characters, '', filename)
    return cleaned_filename


def directory_path(instance, filename):
    return f'SurrogacyMother/{clean_filepath("_".join(instance.name.split()))}/{filename}'


class SurrogacyMother(models.Model):
    name = models.CharField(max_length=255, verbose_name=_('Name'))
    country = models.CharField(
        max_length=3,
        choices=COUNTRY_CHOICES,
        default='UZB',
        verbose_name=_('Country')
    )
    created = models.DateTimeField(auto_now_add=True, verbose_name=_('Created'))
    file = models.FileField(upload_to=directory_path, default='', verbose_name=_('File'))
    related_mother = models.ForeignKey(
        'self',  # Refers to the same model (SurrogacyMother)
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('Related Mother')
    )

    def __str__(self):
        return self.name

    def delete(self, *args, **kwargs):
        if settings.DEBUG:
            # Delete the associated file from the filesystem
            if self.file and os.path.isfile(self.file.path):
                os.remove(self.file.path)
        else:
            self.file.delete(save=False)

        super().delete(*args, **kwargs)

    class Meta:
        verbose_name = _('Surrogacy Mother')
        verbose_name_plural = _('Surrogacy Mothers')


class Date(models.Model):
    surrogacy = models.ForeignKey(SurrogacyMother, on_delete=models.CASCADE, related_name='choose_dates')
    entry = models.DateField(verbose_name=_('Entry'))
    exit = models.DateField(verbose_name=_('Exit'))
    country = models.CharField(max_length=3, choices=COUNTRY_CHOICES, verbose_name=_('Country'))
    disable = models.BooleanField(default=False, verbose_name=_('Disable'))

    class Meta:
        indexes = [
            models.Index(fields=['surrogacy', 'country', 'exit']),
        ]
        verbose_name = _('Date')
        verbose_name_plural = _('Dates')


class Ukraine(SurrogacyMother):
    class Meta:
        proxy = True
        verbose_name = _('Ukraine')
        verbose_name_plural = _('Ukraine')


class Moldova(SurrogacyMother):
    class Meta:
        proxy = True
        verbose_name = _('Moldova')
        verbose_name_plural = _('Moldova')


class Uzbekistan(SurrogacyMother):
    class Meta:
        proxy = True
        verbose_name = _('Uzbekistan')
        verbose_name_plural = _('Uzbekistan')


class Message(models.Model):
    chat_id = models.CharField(max_length=255)
    message_id = models.CharField(max_length=255)
    message_hash = models.CharField(max_length=64, unique=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message {self.message_id} in Chat {self.chat_id}"

    class Meta:
        unique_together = ('chat_id', 'message_id', 'message_hash')
