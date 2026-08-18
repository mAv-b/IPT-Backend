from django import forms
from django.utils.translation import gettext as _

from ... import models

class MaterialAdminForm(forms.ModelForm):
    class Meta:
        model = models.Material
        fields = "__all__"
        labels = {
            "material_name": _("Material's Name"),
            "material_description": _("Material's Description"),
            "material_image": _("Material's Image"),
            "experiments": _("Experiments With This Material"),
        }
        help_text = {}