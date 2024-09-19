from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _

class ScheduleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'schedule'
    verbose_name = _('schedule')

    def ready(self):
        import schedule.signals
