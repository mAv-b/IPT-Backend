from django import forms
from django.utils.translation import gettext as _

from ... import models

class ScienceAreaAdminForm(forms.ModelForm):
    class Meta:
        model = models.ScienceArea
        fields = "__all__"
        labels = {
            "area_code": _("Code Of Science Area"),
            "area_name": _("Science Area Name"),
            "description": _("Description Of Area"),
            "experiments": _("Experiments In This Science Area")
        }
        help_text = {
            "area_code": _("The area code is a identifier. Format: XXX"),
            "description": _("Describe the science area")
        }
        localized_fields = [
            "created_at", "updated_at"]
        
        widgets= {
            "description": forms.Textarea(
                attrs={
                    "row": 4,
                    "cols": 80,
                },
            ),
        }
    

    class Media:
        css = {
            "all": ["css/science_area_admin_form.css"],
        }

        js = {
            forms.widgets.Script( # type: ignore
                "js/science_area_admin_form.js",
                **{
                    "defer": True,
                }
            ),
        }