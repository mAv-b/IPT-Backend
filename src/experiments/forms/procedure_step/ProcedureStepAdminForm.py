from django import forms
from django.utils.translation import gettext as _

from ... import models

class ProcedureStepAdminForm(forms.ModelForm):
    class Meta:
        model = models.ProcedureStep
        fields = "__all__"
        labels = {
            "experiment": _("Experiment's Procedure Step"),
            "step_order": _("Step Order"),
            "step_name": _("Step's Name"),
            "step_description": _("Step's Description"),
            "step_observation": _("Step's Observation"),
        }
        help_text = {}