from datetime import datetime
import pytz
from django.contrib import admin
from django.db import transaction
from django.db.models import Prefetch, OuterRef, Subquery
from django.utils.html import format_html
from schedule.inlines import NewCountryDateInline, DateInline
from schedule.models import Uzbekistan, SurrogacyMother, Date
from django.utils.translation import gettext_lazy as _


@admin.register(SurrogacyMother)
class AutocompleteMotherAdmin(admin.ModelAdmin):
    ordering = ['-created']
    search_fields = ['name']

    def has_module_permission(self, request):
        # Return False to hide this model from the admin dashboard
        return False


@admin.register(Uzbekistan)
class UzbekistanAdmin(admin.ModelAdmin):
    autocomplete_fields = 'related_mother',
    inlines = [DateInline, NewCountryDateInline]
    list_per_page = 15
    # ordering = '-created',
    search_fields = 'name', 'country'
    readonly_fields = 'country',
    list_display = 'name', 'get_html_photo', 'calculate_days', 'country'

    class Media:
        css = {
            'all': ('css/image_scale.css',)
        }
        js = 'js/imageScale.js', 'js/controlDate.js', 'js/hidePelement.js', 'js/shortenTextInTag.js',

    def get_inline_instances(self, request, obj=None):

        inline_instances = []

        if obj is None:
            for inline_class in [NewCountryDateInline]:
                inline_instance = inline_class(self.model, self.admin_site)
                inline_instances.append(inline_instance)
        else:
            for inline_class in self.inlines:
                inline_instance = inline_class(self.model, self.admin_site)
                inline_instances.append(inline_instance)

        return inline_instances

    def get_search_results(self, request, queryset, search_term):

        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        if search_term:
            queryset = SurrogacyMother.objects.filter(name__icontains=search_term)
        return queryset, use_distinct

    def get_fields(self, request, obj=None):

        if obj:
            return ['name', 'file', 'country']
        else:
            return ['name', 'related_mother', 'file']

    def get_queryset(self, request):
        """
        Gets only last `Date instance` with latest exit for each Mother instances.
        """

        latest_date_subquery = Date.objects.filter(
            surrogacy_id=OuterRef('surrogacy_id'),
            country='UZB'
        ).order_by('-exit').values('id')[:1]

        date_qs = Date.objects.filter(id=Subquery(latest_date_subquery))

        return SurrogacyMother.objects.prefetch_related(
            Prefetch('choose_dates', queryset=date_qs, to_attr='uzb_dates')
        ).filter(country='UZB')

    def calculate_days(self, obj):

        if obj is not None:

            if hasattr(obj, 'uzb_dates') and obj.uzb_dates:
                last_date = obj.uzb_dates[0]

                if last_date:
                    kiev_tz = pytz.timezone('Europe/Kiev')

                    date_time = datetime.combine(last_date.exit, datetime.min.time())
                    exit = kiev_tz.localize(date_time)

                    date_time = datetime.combine(last_date.entry, datetime.min.time())
                    entry = kiev_tz.localize(date_time)

                    return (exit - entry).days + 1
        return '-'

    calculate_days.short_description = _('Days')

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

    def save_related(self, request, form, formsets, change):
        """
        Define each country is saved in Date instance.
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
                            # Use the country selected in the inline form
                            Date.objects.filter(id=date_instance.id).update(country=cleaned_data['country'])

                            SurrogacyMother.objects.filter(id=surrogacy_instance.id).update(country=cleaned_data['country'])
                        else:
                            # Default to the parent's country if no country is selected in the inline
                            Date.objects.filter(id=date_instance.id).update(country=surrogacy_instance.country)

                        date_instance.save()

        super().save_related(request, form, formsets, change)

    def save_model(self, request, obj, form, change):

        if not change and obj.related_mother:
            related_mother = obj.related_mother

            related_mother = SurrogacyMother.objects.prefetch_related('choose_dates').get(id=related_mother.id)

            super().save_model(request, obj, form, change)

            date_objects = [
                Date(surrogacy=obj,
                     entry=date_obj.entry,
                     exit=date_obj.exit,
                     country=date_obj.country,
                     disable=date_obj.disable
                     )
                for date_obj in related_mother.choose_dates.iterator(chunk_size=50)
            ]

            # Bulk create the Date objects in one query
            with transaction.atomic():
                Date.objects.bulk_create(date_objects)

        else:
            super().save_model(request, obj, form, change)
