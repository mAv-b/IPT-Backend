from django import forms
from django.utils.translation import gettext as _

from ... import models

class ExperimentAdminForm(forms.ModelForm):
    class Meta:
        model = models.Experiment
        fields = "__all__"
        labels = {
            "experiment_slug": _("Experiment Slug"),
            "experiment_name": _("Experiment Name"),
            "experiment_time": _("Time"),
            "experiment_difficult": _("Difficult"),
            "experiment_description": _("Description"),
            "experiment_model": _("Model/Theory"),
            "experiment_result": _("Results/Conclusions"),
            "experiment_executations": _("Number Of Executations"),
            "experiment_cautions": _("Cautions"),
            "is_visible": _("Let Visible?"),
            "is_ipt_experiment": _("Is an IPT Experiment?"),
            "ipt_date": _("IPT Date of Experiment"),
        }
        help_text = {
            "experiment_slug": _("Short name for url of experiment's page."),
            "experiment_time": _(""),
            "experiment_difficult": _(""),
        }