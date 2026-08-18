from typing import Any, cast

from django import forms
from django.utils.translation import gettext as _

from ... import widgets
from ... import models

from . import fields as _fields

class ArchiveAdminForm(forms.ModelForm):
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

    experiment = _fields.ArchiveModelChoiceField(
        queryset=models.Experiment.objects.all(),
        required=False, empty_label=_("Select an experiment"),
        widget=widgets.ArchiveModelChoice
    ).metadata_mixin(
            is_initially_hidden=True,
            id_outer_container="id_experiment-outer-container",
            is_group_start=True,
            group_title=_("Archive's Association Section"),
            group_dict={
                "id_float_tag":"id_float-tag-classification-archive",
                "class_float_tag_container":"float-container-tag",
            }
    )

    procedure_step = _fields.ArchiveModelChoiceField(
        queryset=models.ProcedureStep.objects.all(),
        required=False, empty_label=_("Select a procedure step"),
        widget=widgets.ArchiveModelChoice,
    ).metadata_mixin(
        is_initially_hidden=True,
        id_outer_container="id_procedure_step-outer-container"
    )

    author = _fields.ArchiveModelChoiceField(
        queryset=models.Author.objects.all(),
        required=False, empty_label=_("Select an author"),
        widget=widgets.ArchiveModelChoice,
    ).metadata_mixin(
        is_initially_hidden=True,
        id_outer_container="id_author-outer-container"
    )

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

        js = [
            forms.widgets.Script( # type: ignore
                "js/utils.js",
                **{
                    "defer": True,
                }
            ),
            forms.widgets.Script( # type: ignore
                "js/archive_admin_form.js",
                **{
                    "defer": True,
                }
            ),
        ]
    
    
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

        self.fields["mime_type"].widget.attrs["id"] = "id_mime_type"

        experiment_field = self.fields["experiment"]
        procedure_step_field = self.fields["procedure_step"]
        author_field = self.fields["author"]

        r_class_name = _fields.ArchiveModelChoiceField.__name__
        if not isinstance(experiment_field, _fields.ArchiveModelChoiceField):
            raise TypeError(
                f"'{experiment_field.label}' is not an instance of '{r_class_name}'")
        elif not isinstance(procedure_step_field, _fields.ArchiveModelChoiceField):
            raise TypeError(
                f"'{procedure_step_field.label}' is not an instance of '{r_class_name}'")
        elif not isinstance(author_field, _fields.ArchiveModelChoiceField):
            raise TypeError(
                f"'{author_field.label}' is not an instance of {r_class_name}")

        experiment_field.required = False
        procedure_step_field.required = False
        author_field.required = False

        experiment_field.widget.current_instance = self.instance.experiment
        procedure_step_field.widget.current_instance = self.instance.procedure_step
        author_field.widget.current_instance = self.instance.author

        archive_field = self.fields["archive"]
        archive_field.widget.attrs["data-file-mime-type"] = ""

        selected_classifications = []
        if self.is_bound:
            selected_classifications = self.data.getlist("classification_archive") # type: ignore
        else:
            if not self.instance._state.adding:

                if self.instance.experiment:
                    selected_classifications.append("experiment")

                    if self.instance.procedure_step:
                        selected_classifications.append("procedure_step")
                        
                elif self.instance.procedure_step:
                    selected_classifications.append("procedure_step")

                elif self.instance.author:
                    selected_classifications.append("author")
                    
                else:
                    selected_classifications.append("other")
                
                archive_field.widget.attrs["data-file-mime-type"] = self.instance.mime_type
            else:
                selected_classifications.append("other")

        self.initial["classification_archive"] = selected_classifications

        experiment_field.is_initially_hidden = "experiment" not in selected_classifications
        author_field.is_initially_hidden = "author" not in selected_classifications
        procedure_step_field.is_initially_hidden = "procedure_step" not in selected_classifications

        return


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
        classification_archive = cast(list[str], classification_archive)

        if "experiment" not in classification_archive:
            cleaned_data["experiment"] = None
        
        if "procedure_step" not in classification_archive:
            cleaned_data["procedure_step"] = None
        
        if "author" not in classification_archive:
            cleaned_data["author"] = None
        
        if "experiment" in classification_archive and experiment is None:
            self.add_error(
                "experiment",
                _("None Object File in Experiment Field")
            )
        elif "procedure_step" in classification_archive and procedure_step is None:
            self.add_error(
                "procedure_step",
                _("None Object File in Procedure Step Field")
            )
        elif "author" in classification_archive and author is None:
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
        print("AQUI NO FORM.SAVE()", self.cleaned_data["experiment"])
        print("AQUI NO FORM.SAVE()", instance.experiment)
        
        if archive is not None:
            instance.size_in_bytes = archive.size

        if commit:
            instance.save()
            self.save_m2m()

        return instance