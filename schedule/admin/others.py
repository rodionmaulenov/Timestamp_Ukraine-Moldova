from django.contrib import admin

from schedule.inlines import NewCountryDateInline, DateInline
from schedule.models import Uzbekistan, SurrogacyMother, Date
from django.utils.translation import gettext_lazy as _


@admin.register(Uzbekistan)
class OthersAdmin(admin.ModelAdmin):
    inlines = [DateInline, NewCountryDateInline]
    list_per_page = 15
    ordering = 'created',
    search_fields = 'name', 'country_selection'
    readonly_fields = 'country_selection',
    list_display = 'name',

    def get_queryset(self, request):
        return SurrogacyMother.objects.filter(country_selection='UZB')


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
                            date_instance.country = cleaned_data['country']

                            surrogacy_instance.country_selection = cleaned_data['country']
                            surrogacy_instance.save()
                        else:
                            # Default to the parent's country_selection if no country is selected in the inline
                            date_instance.country = surrogacy_instance.country_selection

                        date_instance.save()

        super().save_related(request, form, formsets, change)

