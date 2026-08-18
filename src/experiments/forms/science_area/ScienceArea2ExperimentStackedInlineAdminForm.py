from django import forms
from django.utils.translation import gettext as _

from ... import models

class ScienceArea2ExperimentStackedInlineAdminForm(forms.ModelForm):
    class Meta:
        model = models.ExperimentToScienceArea
        fields = "__all__"
        labels = {
            "created_at": _("Created At"),
            "updated_at": _("Updated At"),
            "experiment": _("Experiment"),
        }
        #TODO Find a way to define new title for new instances of experiments in the Stacked
        localized_fields = [
            "created_at", "updated_at"]
        

    class Media:
        css = {
            "all": ["css/stackedinline_science_area_admin_form.css"],
        }

        js = {
            forms.widgets.Script(# type: ignore
                "js/stackedinline_science_area_admin_form.js",
                **{
                    "defer": True,
                }
            )
        }