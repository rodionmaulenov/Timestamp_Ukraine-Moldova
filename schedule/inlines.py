from datetime import datetime
from django import forms
import pytz
from django.contrib.admin import TabularInline
from django.utils.translation import gettext_lazy as _
from schedule.models import Date


class NewCountryDateFormset(forms.models.BaseInlineFormSet):
    def clean(self):

        if not self.is_valid():
            return

        for ind, form in enumerate(self.forms[:-1]):
            if form.cleaned_data and not form.cleaned_data['disable']:
                form.add_error('disable', 'Turn on this field')


class NewCountryDateInline(TabularInline):
    formset = NewCountryDateFormset
    extra = 0
    fields = ['entry', 'exit', 'calculate_days', 'disable', 'country']
    readonly_fields = ['calculate_days']
    model = Date
    verbose_name = _("Define date")
    verbose_name_plural = _("Define dates")
    template = 'admin/schedule/date/tabular.html'
    ordering = 'entry', 'exit'


    class Media:
        css = {
            'all': ('css/tabular/tabular_date.css',)
        }

        js =   'js/rmHelpText.js', 'js/tabular/foldUnfoldRows.js', 'js/tabular/changeRowMode.js',

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

    calculate_days.short_description = _('Days')


    def has_delete_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request, obj):
        return True

    def has_view_permission(self, request, obj=None):
        return True

    def has_change_permission(self, request, obj=None):
        return True







