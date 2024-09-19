from django.db.models.signals import pre_delete
from django.dispatch import receiver
import os
from schedule.models import SurrogacyMother
from django.conf import settings

@receiver(pre_delete, sender=SurrogacyMother)
def delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes file from file system when using the admin`s action.
    """
    if settings.DEBUG:
        if instance.file and os.path.isfile(instance.file.path):
            os.remove(instance.file.path)
    else:
        instance.file.delete(save=False)