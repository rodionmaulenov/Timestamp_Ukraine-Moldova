import pytz
from django.contrib import admin
from datetime import timedelta, datetime
from django.db.models import OuterRef, Prefetch, Subquery
from django.utils.safestring import mark_safe
from schedule.inlines import NewCountryDateInline
from django.utils.html import format_html
from django.urls import path
from django.http import JsonResponse
from django.template.loader import render_to_string
from schedule.models import SurrogacyMother, Ukraine, Date
from schedule.services import calculate_dates
from django.utils.translation import gettext_lazy as _


@admin.register(Ukraine)
class UkraineAdmin(admin.ModelAdmin):
    search_help_text = mark_safe(_(
        "1. <b>Update date</b>: Indicates when a new 90-day stay period in country began. "
        "On this day the patient receives a new 1 day, the next day – the next new 1 day, and so on up to 90 days.<br>"
        "2. <b>Days have passed</b>: Shows the number of days that have already been used in the current stay period.<br>"
        "3. <b>Days Left</b>: Displays the number of remaining days in the current stay period.<br>"
        "4. <b>Control date</b>: Allows you to check the status for a specific date.")
    )
    list_per_page = 15
    ordering = '-created',
    search_fields = 'name', 'country'
    readonly_fields = 'country',
    inlines = NewCountryDateInline,
    list_display = 'name', 'get_html_photo', 'get_days_spent', 'get_days_exist', 'get_update_date', "control_date"

    class Media:
        css = {
            'all': ('css/image_scale.css',)
        }
        js = 'js/imageScale.js', 'js/controlDate.js', 'js/hidePelement.js', 'js/preventSubmit.js'

    def get_fields(self, request, obj=None):
        if obj:
            return ['name', 'file', 'country']
        else:
            return ['name', 'related_mother', 'file']

    def get_queryset(self, request):
        # Subquery to fetch the latest date for each SurrogacyMother
        latest_date_subquery = Date.objects.filter(
            surrogacy_id=OuterRef('surrogacy_id'),
            country='UKR'
        ).order_by('-exit').values('id')[:1]

        latest_date_qs = Date.objects.filter(id=Subquery(latest_date_subquery), country='UKR').only('surrogacy', 'exit')

        all_dates_qs = Date.objects.filter(country='UKR').only('surrogacy', 'entry', 'exit')

        return SurrogacyMother.objects.only('name', 'country', 'file').prefetch_related(
            Prefetch('choose_dates', queryset=latest_date_qs, to_attr='latest_date'),
            Prefetch('choose_dates', queryset=all_dates_qs, to_attr='prefetched_dates')
        ).filter(country='UKR')


    @admin.action(description=_('Control date'))
    def control_date(self, obj):
        return format_html((render_to_string('admin/schedule/control_date.html', {'obj': obj})))

    def get_latest_date(self, obj):
        """
        Use the prefetched 'latest_date' to avoid hitting the database multiple times.
        """
        if hasattr(obj, 'latest_date') and obj.latest_date:
            return obj.latest_date[0]
        return None

    @admin.action(description=_('Update Date'))
    def get_update_date(self, obj):

        kiev_tz = pytz.timezone('Europe/Kiev')

        date_obj = self.get_latest_date(obj)

        if date_obj is not None:
            control_date = date_obj.exit

            date_time = datetime.combine(control_date, datetime.min.time())
            localize_date = kiev_tz.localize(date_time)

            return (localize_date + timedelta(days=91)).date()

    @admin.action(description=_('Days have passed'))
    def get_days_spent(self, obj):

        date_obj = self.get_latest_date(obj)

        if date_obj is not None:
            control_date = date_obj.exit

            _, total_days_stayed = calculate_dates(obj, control_date, pre_fetched_dates=obj.prefetched_dates)

            return total_days_stayed

    @admin.action(description=_('Days left'))
    def get_days_exist(self, obj):

        date_obj = self.get_latest_date(obj)

        if date_obj is not None:
            control_date = date_obj.exit

            days_left, _ = calculate_dates(obj, control_date, pre_fetched_dates=obj.prefetched_dates)

            return days_left

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
                        <img src='{}' class='hoverable-image' />
                    </div>
                    """, file_url
                )
        return '-'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('calculate_control_date/', self.admin_site.admin_view(self.calculate_control_date),
                 name='calculate-control-date'),
        ]
        return custom_urls + urls

    def calculate_control_date(self, request):

        surrogacy_mother_id = request.GET.get('id')
        control_date = request.GET.get('control_date')

        control_date = datetime.strptime(control_date, '%Y-%m-%d')
        obj = SurrogacyMother.objects.get(pk=surrogacy_mother_id)

        days_left, _ = calculate_dates(obj, control_date)

        return JsonResponse({'days_left': days_left})

    def save_related(self, request, form, formsets, change):
        """
        Has been using on change page in inline form for setting one country in inline `Date` instance
        and `Mother` instance.
        """
        surrogacy_instance = form.instance

        for formset in formsets:
            if formset.model == Date:
                for inline_form in formset.forms:
                    if inline_form.cleaned_data:
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
