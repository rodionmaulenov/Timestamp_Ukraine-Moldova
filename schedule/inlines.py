from datetime import datetime
from django import forms
import pytz
from django.contrib.admin import TabularInline
from django.utils.translation import gettext_lazy as _
from django.contrib import admin
from schedule.models import Date


class NewCountryDateFormset(forms.models.BaseInlineFormSet):
    def clean(self):
        for ind, form in enumerate(self.forms):
            if len(self.forms) == 2:
                if ind == 0:
                    if form.cleaned_data and not form.cleaned_data['disable']:
                        form.add_error('disable', 'Turn on this field')


class NewCountryDateInline(TabularInline):
    formset = NewCountryDateFormset
    extra = 0
    fields = ['entry', 'exit', 'disable', 'country']
    radio_fields = {"country": admin.HORIZONTAL}
    model = Date
    max_num = 2
    verbose_name = _("Define date")
    verbose_name_plural = _("Define dates")

    def get_queryset(self, request):
        """
        Override the queryset to hide existing Date objects.
        """
        return Date.objects.none()

    def has_delete_permission(self, request, obj=None):
        return False


class DateInline(TabularInline):
    extra = 0
    fields = ['entry', 'exit', 'disable', 'calculate_days', 'country']
    readonly_fields = ['calculate_days']
    radio_fields = {"country": admin.HORIZONTAL}
    model = Date
    verbose_name = _("Control date")
    verbose_name_plural = _("Control dates")
    max_num = 1

    class Media:

        js = 'js/rmHelpText.js',

    def get_queryset(self, request):
        qs = super().get_queryset(request)

        if 'moldova' in request.path.split('/'):
            return qs.filter(country='MLD')

        if 'ukraine' in request.path.split('/'):
            return qs.filter(country='UKR')

        if 'uzbekistan' in request.path.split('/'):
            return qs.filter(country='UZB')

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

    def has_delete_permission(self, request, obj=None):
        return False

    calculate_days.short_description = _('Days')
