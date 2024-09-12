import pytz
from django.contrib import admin
from datetime import timedelta, datetime
from django.utils.safestring import mark_safe
from schedule.inlines import DateInline, DocumentInline
from django.utils.html import format_html
from django.urls import path
from django.http import JsonResponse
from django.template.loader import render_to_string
from schedule.models import SurrogacyMother, Ukraine, Moldova
from schedule.services import calculate_dates


@admin.register(Ukraine)
class UkraineAdmin(admin.ModelAdmin):
    search_help_text = mark_safe(
        "1. <b>Update date</b>: Indicates when a new 90-day stay period in Ukraine began. "
        "On this day the patient receives a new 1 day, the next day – the next new 1 day, and so on up to 90 days.<br>" + \
        "2. <b>Days have passed</b>: Shows the number of days that have already been used in the current stay period.<br>" + \
        "3. <b>Days Left</b>: Displays the number of remaining days in the current stay period.<br>" + \
        "4. <b>Control date</b>: Allows you to check the status for a specific date.")
    list_per_page = 15
    ordering = 'created',
    search_fields = 'name', 'country_selection'
    radio_fields = {"country_selection": admin.HORIZONTAL}
    inlines = DateInline, DocumentInline
    list_display = 'name', 'get_html_photo', 'get_days_spent', 'get_days_exist', 'get_update_date', "control_date", \
        'country_selection'
    list_editable = 'country_selection',

    class Media:
        css = {
            'all': ('css/image_scale.css',)
        }
        js = 'js/imageScale.js', 'js/controlDate.js', 'js/hidePelement.js', 'js/preventSubmit.js'

    def get_queryset(self, request):
        return SurrogacyMother.objects.filter(country_selection='UKR')


    @admin.action(description='Control date')
    def control_date(self, obj):
        return format_html((render_to_string('admin/schedule/control_date.html', {'obj': obj})))

    @admin.action(description='Update Date')
    def get_update_date(self, obj):

        kiev_tz = pytz.timezone('Europe/Kiev')

        date_obj = obj.choose_dates.filter(country=obj.country_selection).order_by('-id').first()

        if date_obj is not None:
            control_date = date_obj.exit

            date_time = datetime.combine(control_date, datetime.min.time())
            localize_date = kiev_tz.localize(date_time)

            return (localize_date + timedelta(days=91)).date()

    @admin.action(description='Days have passed')
    def get_days_spent(self, obj):

        date_obj = obj.choose_dates.filter(country=obj.country_selection).order_by('-id').first()

        if date_obj is not None:
            control_date = date_obj.exit

            _, total_days_stayed = calculate_dates(obj, control_date)

            return total_days_stayed

    @admin.action(description='Days left')
    def get_days_exist(self, obj):

        date_obj = obj.choose_dates.filter(country=obj.country_selection).order_by('-id').first()

        if date_obj is not None:
            control_date = date_obj.exit

            days_left, _ = calculate_dates(obj, control_date)

            return days_left

    @admin.action(description='Image')
    def get_html_photo(self, obj):
        if obj.document and obj.document.file:
            file_url = obj.document.file.url

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

    @staticmethod
    def calculate_control_date(request):

        surrogacy_mother_id = request.GET.get('id')
        control_date = request.GET.get('control_date')

        control_date = datetime.strptime(control_date, '%Y-%m-%d')
        obj = SurrogacyMother.objects.get(pk=surrogacy_mother_id)

        days_left, _ = calculate_dates(obj, control_date)

        return JsonResponse({'days_left': days_left})



@admin.register(Moldova)
class MoldovaAdmin(admin.ModelAdmin):
    search_help_text = mark_safe(
        "1. <b>Update date</b>: Indicates when a new 90-day stay period in Ukraine began. "
        "On this day the patient receives a new 1 day, the next day – the next new 1 day, and so on up to 90 days.<br>" + \
        "2. <b>Days have passed</b>: Shows the number of days that have already been used in the current stay period.<br>" + \
        "3. <b>Days Left</b>: Displays the number of remaining days in the current stay period.<br>" + \
        "4. <b>Control date</b>: Allows you to check the status for a specific date.")
    list_per_page = 15
    ordering = 'created',
    search_fields = 'name', 'country_selection'
    radio_fields = {"country_selection": admin.HORIZONTAL}
    inlines = DateInline, DocumentInline
    list_display = 'name', 'get_html_photo', 'get_days_spent', 'get_days_exist', 'get_update_date', "control_date", \
        'country_selection'
    list_editable = 'country_selection',

    class Media:
        css = {
            'all': ('css/image_scale.css',)
        }
        js = 'js/imageScale.js', 'js/controlDate.js', 'js/hidePelement.js',

    def get_queryset(self, request):
        return SurrogacyMother.objects.filter(country_selection='MLD')

    @admin.action(description='Control date')
    def control_date(self, obj):
        return format_html((render_to_string('admin/schedule/control_date.html', {'obj': obj})))

    @admin.action(description='Update Date')
    def get_update_date(self, obj):

        kiev_tz = pytz.timezone('Europe/Kiev')

        date_obj = obj.choose_dates.filter(country=obj.country_selection).order_by('-id').first()

        if date_obj is not None:
            control_date = date_obj.exit

            date_time = datetime.combine(control_date, datetime.min.time())
            localize_date = kiev_tz.localize(date_time)

            return (localize_date + timedelta(days=91)).date()

    @admin.action(description='Days have passed')
    def get_days_spent(self, obj):

        date_obj = obj.choose_dates.filter(country=obj.country_selection).order_by('-id').first()

        if date_obj is not None:
            control_date = date_obj.exit
            _, total_days_stayed = calculate_dates(obj, control_date)

            return total_days_stayed

    @admin.action(description='Days left')
    def get_days_exist(self, obj):

        date_obj = obj.choose_dates.filter(country=obj.country_selection).order_by('-id').first()
        if date_obj is not None:
            control_date = date_obj.exit

            days_left, _ = calculate_dates(obj, control_date)

            return days_left

    @admin.action(description='Image')
    def get_html_photo(self, obj):
        if obj.document and obj.document.file:
            file_url = obj.document.file.url

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

    @staticmethod
    def calculate_control_date(request):

        surrogacy_mother_id = request.GET.get('id')
        control_date = request.GET.get('control_date')

        control_date = datetime.strptime(control_date, '%Y-%m-%d')
        obj = SurrogacyMother.objects.get(pk=surrogacy_mother_id)

        days_left, _ = calculate_dates(obj, control_date)

        return JsonResponse({'days_left': days_left})
