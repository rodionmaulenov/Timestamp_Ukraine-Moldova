from datetime import datetime
import pytz
from django.contrib import admin
from django.db.models import Prefetch, OuterRef, Subquery
from django.utils.html import format_html
from schedule.inlines import NewCountryDateInline
from schedule.models import Uzbekistan, SurrogacyMother, Date
from django.utils.translation import gettext_lazy as _


@admin.register(SurrogacyMother)
class AutocompleteMotherAdmin(admin.ModelAdmin):
    ordering = ['created']
    search_fields = ['name']

    def has_module_permission(self, request):
        # Return False to hide this model from the admin dashboard
        return False

    def has_view_permission(self, request, obj=None):
        # Allow access to the autocomplete view, but not to the entire model
        if request.path.startswith('/admin/autocomplete/'):
            return True
        return super().has_view_permission(request, obj)


@admin.register(Uzbekistan)
class UzbekistanAdmin(admin.ModelAdmin):
    autocomplete_fields = 'related_mother',
    inlines = NewCountryDateInline,
    list_per_page = 20
    search_fields = 'name', 'country'
    readonly_fields = 'country',
    list_display = 'name', 'get_html_photo', 'calculate_days', 'country'

    class Media:
        css = {
            'all': ('css/image_scale.css',)
        }
        js = ('js/inline/tabularInline.js', 'js/imageScale.js', 'js/controlDate.js', 'js/hidePelement.js',
              'js/shortenTextInTag.js',)

    def get_search_results(self, request, queryset, search_term):

        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        if search_term:
            queryset = queryset.filter(name__icontains=search_term)
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

        self.request = request

        latest_date_subquery = Date.objects.filter(
            surrogacy_id=OuterRef('surrogacy_id'),
            country='UZB'
        ).order_by('-exit').values('id')[:1]

        latest_date_qs = Date.objects.filter(id=Subquery(latest_date_subquery))

        return SurrogacyMother.objects.only('name', 'country', 'file').prefetch_related(
            Prefetch('choose_dates', queryset=latest_date_qs, to_attr='latest_date')
        ).filter(country='UZB')

    def get_latest_date(self, obj):
        """
        Use the prefetched 'latest_date' to avoid hitting the database multiple times.
        """
        # Since 'latest_date' is pre-fetched, access it directly from the cached data
        if hasattr(obj, 'latest_date') and obj.latest_date:
            return obj.latest_date[0]  # Get the first (and only) date in the prefetched list
        return None

    def calculate_days(self, obj):

        if obj is not None:
            last_date = self.get_latest_date(obj)

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
                        <a href="#" class="view-photo-link">view</a>
                        <img src='{}' class='hoverable-image' style="display:none;" />
                    </div>
                    """, file_url
                )
        return '-'

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

    def save_model(self, request, obj, form, change):
        """
        Used only once when creating a new Mother instance, copying an existing Mother instance.
        Creates new Date objects and assigns them to the new Mother instance.
        These Date objects are exact copies of another Date objects that belong to the Mother instance,
        which in this case acts as a donor.
        """

        if not change and obj.related_mother:
            related_mother = obj.related_mother

            # Because the mother may be found in a different query set than UZB
            related_mother = SurrogacyMother.objects.prefetch_related('choose_dates').get(id=related_mother.id)
            obj.country = related_mother.country

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

            Date.objects.bulk_create(date_objects)

        else:
            super().save_model(request, obj, form, change)
