from datetime import datetime

import pytz
from django.contrib.admin import TabularInline, StackedInline
from schedule.models import Date, Document


class DocumentInline(StackedInline):
    model = Document
    extra = 1
    fields = ['title', 'file']
    max_num = 1

class DateInline(TabularInline):
    extra = 0
    fields = ['disable', 'entry', 'exit', 'calculate_days']
    readonly_fields = ['calculate_days']
    model = Date

    class Media:

        js = 'js/rmHelpText.js',

    def get_queryset(self, request):
        qs = super().get_queryset(request)

        if 'ukraine' in request.path.split('/'):
            return qs.filter(country='UKR')

        if 'moldova' in request.path.split('/'):
            return qs.filter(country='MLD')

    def calculate_days(self, obj):
        if obj is not None:
            if obj.entry and obj.exit:

                kiev_tz = pytz.timezone('Europe/Kiev')

                date_time = datetime.combine(obj.exit, datetime.min.time())
                exit = kiev_tz.localize(date_time)

                date_time = datetime.combine(obj.entry, datetime.min.time())
                entry = kiev_tz.localize(date_time)

                return (exit - entry).days + 1
        return '-'

    calculate_days.short_description = 'Days'





