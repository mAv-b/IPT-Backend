from typing import Any, Mapping

from django import forms
from django.core.files.base import File
from django.db.models.base import Model
from django.forms.utils import ErrorList
from django.utils.translation import gettext as _

from ipt_backend import settings

from . import models
from . import widgets
from . import validators

class ExperimentsAdminForm(forms.ModelForm):
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


class AuthorAdminForm(forms.ModelForm):
    author_picture = forms.ImageField(
        max_length=255, required=False,
        initial=None,
        widget=widgets.AuthorPictureWidget,
        label=_("Author Picture"),
        help_text=_("The author's picture to be used in articles of web-site, etc..."),
        ) # ADD ERROR_MESSAGES

    class Meta:
        model = models.Author
        fields = "__all__"
        labels = {
            "author_name": _("Author's Name"),
            "is_editor": _("Is An Editor?"),
        }
        help_texts = {
            "author_name": _("Please Insert Author's Fullname."),
        }
        localized_fields = [
            "created_at", "updated_at"]

    
    class Media:
        css = {
            "all": ["css/author_admin_form.css"],
        }

        js = {
            forms.widgets.Script(  # type: ignore
                "js/author_admin_form.js",
                **{
                    "defer": True,
                }
            ),
        }

    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        author_picture_field = self.fields["author_picture"]
        if not self.instance._state.adding:
            author = self.instance

            try:
                related_archive = author.author_picture_file
                author_picture = related_archive.archive
                author_picture_field.initial = author_picture
            except models.Archives.DoesNotExist:
                author_picture_field.initial = settings.DEFAULT_PROFILE_IMAGE
        else:
            author_picture_field = settings.DEFAULT_PROFILE_IMAGE

    
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


class ArchivesAdminForm(forms.ModelForm):
    ARCHIVES_CLASSIFICATIONS = [
        ("experiment", _("Experiment")), 
        ("procedure_step", _("Procedure Step")), 
        ("author_picture", _("Author Image")),
        ("other", _("Other"))]
    
    ARCHIVES_CLASSIFICATIONS_HELP_TEXTS = {
        "experiment": _("Document, image, or other archive for an experiment"),
        "procedure_step": _("Image, or other file for a step; Can be in a experiment"),
        "author_picture": _("Author profile image, is a exclusive classification"),
        "other": _("An indepedent archive, that not in any other classification above")
    }

    classification_archive = forms.MultipleChoiceField(
        widget=widgets.ArchiveClassificationCustomSelectWidget(option_help_texts=ARCHIVES_CLASSIFICATIONS_HELP_TEXTS),
        choices=ARCHIVES_CLASSIFICATIONS,
        required=False, initial=[], label=_("Archive's Classification"),
        help_text=_("Choose the classification of archive"),)

    experiment = forms.ModelChoiceField(
        queryset=models.Experiment.objects.all(),
        required=False, empty_label=_("Select an experiment"),
        widget=widgets.Archive2ExperimentModelChoice)
    
    # procedure_step = forms.ModelChoiceField(
    #     queryset=models.ProcedureStep.objects.all(),
    #     required=False, empty_label=_("Select a procedure step"),
    #     widget=forms.Select,)
    
    # author = forms.ModelChoiceField(
    #     queryset=models.Author.objects.all(),
    #     required=False, empty_label=_("Select an author"),
    #     widget=forms.Select,)

    class Meta:
        model = models.Archives
        fields = [
            "classification_archive", "experiment", "procedure_step",
            "author", "order", "archive_name", "archive", "mime_type"]
        labels = {
            "experiment": _("Archive's Experiment"),
            "procedure_step": _("Archive's Procedures Steps"),
            "author": _("Archives's Author"),
            "order": _("Display Order"),
            "archive_name": _("Archive's Name"),
            "archive": _("Archive"),
            "mime_type": _("MIME Type")
        }
        help_texts = {
            "order": _("a help field for the position of file, in experiment, or procedure step"),
            "mime_type": _("MIME type is the classification of archive, based in the type file, and extension. Any doubt search online"),
        }
        localized_fields = [
            "created_at", "updated_at"
        ]

        widgets = {
            "archive": widgets.ArchiveFileFieldWidget,
        }

    
    class Media:
        css = {
            "all": ["css/archive_admin_form.css"],
        }

        js = {
            forms.widgets.Script( # type: ignore
                "js/archive_admin_form.js",
                **{
                    "defer": True,
                }
            )
        }
    
    
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

        self.fields["mime_type"].widget.attrs["id"] = "id_mime_type"

        self.fields["experiment"].required = False
        self.fields["procedure_step"].required = False
        self.fields["author"].required = False

        # Alternative 2 for hidden state, verify later
        # self.fields["experiment"].widget.attrs["is_hidden_initial_state"] = True
        # self.fields["procedure_step"].widget.attrs["is_hidden_initial_state"] = True
        # self.fields["author"].widget.attrs["is_hidden_initial_state"] = True

        self.fields["experiment"].is_hidden_initial_state = True # type: ignore
        self.fields["procedure_step"].is_hidden_initial_state = True # type: ignore
        self.fields["author"].is_hidden_initial_state = True # type: ignore

        self.fields["archive"].widget.attrs["data-file-mime-type"] = ""

        if not self.instance._state.adding:
            
            if self.instance.experiment:
                self.fields["classification_archive"].initial += ["experiment"]
                if self.instance.procedure_step:
                    self.fields["classification_archive"].initial += ["procedure_step"]
            elif self.instance.procedure_step:
                self.fields["classification_archive"].initial += ["procedure_step"]
            elif self.instance.author:
                self.fields["classification_archive"].initial += ["author"]
            else:
                self.fields["classification_archive"].initial += ["other"]
            
            self.fields["archive"].widget.attrs["data-file-mime-type"] = self.instance.mime_type
        else:
            self.fields["classification_archive"].initial += ["other"]
        

    def clean_archive(self):
        archive = self.cleaned_data.get("archive")

        if archive is None:
            self.add_error("archive",
                           _("Archive field is empty. You must insert a file."))
        
        return archive
            
        # print(archive, type(archive))
        # print(dir(archive))
          
    
    def clean(self):
        cleaned_data = super().clean()

        experiment, procedure_step, author = cleaned_data.get("experiment"), cleaned_data.get("procedure_step"), cleaned_data.get("author")

        classification_archive = cleaned_data.get("classification_archive")
        if classification_archive != "experiment":
            cleaned_data["experiment"] = None
        
        if classification_archive != "procedure_step":
            cleaned_data["procedure_step"] = None
        
        if classification_archive != "author":
            cleaned_data["author"] = None
        
        if classification_archive == "experiment" and experiment is None:
            self.add_error(
                "experiment",
                _("None Object File in Experiment Field")
            )
        elif classification_archive == "procedure_step" and procedure_step is None:
            self.add_error(
                "procedure_step",
                _("None Object File in Procedure Step Field")
            )
        elif classification_archive == "author" and author is None:
            self.add_error(
                "author",
                _("None Object File in author field")
            )

        # if not self.instance or not self.instance.archive_name:
        #     print(cleaned_data["archive"].size)
        #     cleaned_data["size_in_bytes"] = cleaned_data["archive"].size
        
        return cleaned_data
    
    
    def save(self, commit:bool=True) -> Any:
        instance = super().save(commit=False)

        archive = self.cleaned_data["archive"]
        
        if archive is not None:
            instance.size_in_bytes = archive.size

        if commit:
            instance.save()
            self.save_m2m()

        return instance
        

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