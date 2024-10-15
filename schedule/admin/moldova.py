import pytz
from django.contrib import admin
from datetime import timedelta, datetime
from django.utils.safestring import mark_safe
from schedule.inlines import NewCountryDateInline
from django.utils.html import format_html
from django.urls import path
from django.http import JsonResponse
from django.template.loader import render_to_string
from schedule.models import SurrogacyMother, Moldova, Date
from schedule.services import calculate_dates, find_when_15_days_left
from django.utils.translation import gettext_lazy as _
from django import forms
from django.contrib.admin.widgets import AdminDateWidget
from django.db.models import Subquery, OuterRef, Prefetch


class ControlDateForm(forms.Form):
    control_date = forms.DateField(widget=AdminDateWidget(), label="Control Date")


@admin.register(Moldova)
class MoldovaAdmin(admin.ModelAdmin):
    search_help_text = mark_safe(_(
        "1. <b>Update date</b>: Indicates when a new 90-day stay period in country began. "
        "On this day the patient receives a new 1 day, the next day – the next new 1 day, and so on up to 90 days.<br>"
        "2. <b>Days have passed</b>: Shows the number of days that have already been used in the current stay period.<br>"
        "3. <b>Days Left</b>: Displays the number of remaining days in the current stay period.<br>"
        "4. <b>Control date</b>: Allows you to check the status for a specific date.")
    )
    list_per_page = 15
    search_fields = 'name', 'country'
    readonly_fields = 'country',
    inlines = NewCountryDateInline,
    list_display = 'name', 'get_html_photo', 'get_days_spent', 'get_days_exist', 'when_15_days_left', 'get_update_date', \
        'control_date_mld', 'ukr_inform_card_link',

    class Media:
        css = {
            'all': ('css/image_scale.css', 'css/tooltip.css', 'css/djangoDateField.css')
        }
        js = ('js/rmExtraDateShortcut.js', 'js/inline/tabularInline.js', 'js/imageScale.js', 'js/hidePelement.js',
              'js/calculateDatesByURL.js', 'js/toggleTooltip.js', 'js/copyCalcDatesToClipboard.js', 'js/tips.js',)

    def get_fields(self, request, obj=None):
        if obj:
            return ['name', 'file', 'country']
        else:
            return ['name', 'related_mother', 'file']

    def get_queryset(self, request):
        latest_date_mld_subquery = Date.objects.filter(
            surrogacy_id=OuterRef('pk'),
            country='MLD'
        ).order_by('-exit').values('exit')[:1]

        latest_date_ukr_subquery = Date.objects.filter(
            surrogacy_id=OuterRef('pk'),
            country='UKR'
        ).order_by('-exit').values('exit')[:1]

        queryset = SurrogacyMother.objects.annotate(
            latest_date_mld=Subquery(latest_date_mld_subquery),
            latest_date_ukr=Subquery(latest_date_ukr_subquery)
        ).only('name', 'country', 'file')

        all_dates_qs = Date.objects.filter(country='MLD').only('surrogacy', 'entry', 'exit')

        queryset = queryset.only('name', 'country', 'file').prefetch_related(
            Prefetch('choose_dates', queryset=all_dates_qs, to_attr='prefetched_dates')
        ).filter(country='MLD')

        return queryset

    @admin.action(description=_('Image'))
    def get_html_photo(self, obj):
        if obj.file:
            file_url = obj.file.url

            if file_url.endswith('.pdf'):
                return '-'
            else:
                return format_html(
                    """
                    <div class='image-container'>
                        <a href="#" class="view-photo-link">view</a>
                        <img src='{}' class='hoverable-image' style="display:none;" />
                    </div>
                    """, file_url
                )
        return '-'

    @staticmethod
    def get_latest_exit(obj):
        if obj is not None:
            if hasattr(obj, 'latest_date_mld') and obj.latest_date_mld:
                return obj.latest_date_mld
        return

    @admin.action(description=_('Days have passed'))
    def get_days_spent(self, obj):
        control_date = self.get_latest_exit(obj)

        _, total_days_stayed = calculate_dates(obj, control_date, pre_fetched_dates=obj.prefetched_dates)

        return total_days_stayed

    @admin.action(description=_('Days left'))
    def get_days_exist(self, obj):
        control_date = self.get_latest_exit(obj)

        days_left, _ = calculate_dates(obj, control_date, pre_fetched_dates=obj.prefetched_dates)

        return days_left

    @admin.action(description=_('When 15 days left'))
    def when_15_days_left(self, obj):
        control_date = self.get_latest_exit(obj)

        date_15_days_left = find_when_15_days_left(obj, control_date, pre_fetched_dates=obj.prefetched_dates)

        return date_15_days_left

    @admin.action(description=_('Update Date'))
    def get_update_date(self, obj):
        kiev_tz = pytz.timezone('Europe/Kiev')

        control_date = self.get_latest_exit(obj)

        date_time = datetime.combine(control_date, datetime.min.time())
        localize_date = kiev_tz.localize(date_time)

        return (localize_date + timedelta(days=91)).date()

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('calculate_control_date_in_ukr/', self.admin_site.admin_view(self.calculate_control_date_in_ukr),
                 name='calculate-control-date-ukr'),
            path('calculate_control_date/', self.admin_site.admin_view(self.calculate_control_date),
                 name='calculate-control-date-ukr'),
        ]
        return custom_urls + urls

    @admin.action(description=_('Control date'))
    def control_date_mld(self, obj):

        form = ControlDateForm()

        rendered_html = render_to_string('admin/schedule/control_date.html', {
            'form': form,
            'obj': obj,
            'country': 'MLD',
        })

        # Safely render the HTML in the admin
        return format_html(rendered_html)

    @staticmethod
    def calculate_control_date(request):

        surrogacy_mother_id = request.GET.get('id')
        control_date = request.GET.get('control_date')

        control_date = datetime.strptime(control_date, '%Y-%m-%d')
        obj = SurrogacyMother.objects.get(pk=surrogacy_mother_id)

        days_left, _ = calculate_dates(obj, control_date, last_equal_control_date=True)
        return JsonResponse({'days_left': days_left})

    @admin.action(description=_('Ukraine`s dates'))
    def ukr_inform_card_link(self, obj):

        form = ControlDateForm()

        return format_html((render_to_string('admin/schedule/inform_card.html',
                                             {
                                                 'form': form,
                                                 'obj': obj,
                                                 'country': 'UKR',
                                                 'update_date_ukr': self.get_update_date_in_ukr(obj)
                                             })))

    def calculate_control_date_in_ukr(self, request):

        surrogacy_mother_id = request.GET.get('id')
        control_date = request.GET.get('control_date')

        control_date = datetime.strptime(control_date, '%Y-%m-%d')
        obj = SurrogacyMother.objects.get(pk=surrogacy_mother_id)

        days_left, _ = calculate_dates(obj, control_date, country='UKR')
        return JsonResponse({'days_left': days_left})

    @admin.action(description=_('Update Date Ukraine'))
    def get_update_date_in_ukr(self, obj):

        kiev_tz = pytz.timezone('Europe/Kiev')

        if hasattr(obj, 'latest_date_ukr') and obj.latest_date_ukr:
            control_date = obj.latest_date_ukr

            date_time = datetime.combine(control_date, datetime.min.time())
            localize_date = kiev_tz.localize(date_time)

            return (localize_date + timedelta(days=91)).date()

        return _('Has`t been in Ukraine')

    def save_related(self, request, form, formsets, change):
        """
        Has been using on change page in inline form for setting one country in inline `Date` instance
        and `Mother` instance.
        """
        surrogacy_instance = form.instance

        for formset in formsets:
            if formset.model == Date:
                for inline_form in formset.forms:
                    if inline_form.cleaned_data and not inline_form.cleaned_data.get('DELETE', False):
                        date_instance = inline_form.instance
                        cleaned_data = inline_form.cleaned_data
                        # Check if the inline form has a country field value
                        if 'country' in cleaned_data and cleaned_data['country']:
                            # Set the country from the inline form
                            date_instance.country = cleaned_data['country']

                            surrogacy_instance.country = cleaned_data['country']
                            surrogacy_instance.save()
                        else:
                            # Set the country from the parent if not selected in the inline
                            date_instance.country = surrogacy_instance.country

                        date_instance.save()

        super().save_related(request, form, formsets, change)
