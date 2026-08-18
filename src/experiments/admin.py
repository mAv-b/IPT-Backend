from typing import Any
from pathlib import Path

from django.contrib import admin
from django.forms.models import ModelForm
from django.http import HttpRequest
from django.utils.translation import gettext as _
from django.utils.html import format_html
from django.core.files.storage import default_storage

from ipt_backend import settings

# from .forms import ExperimentsAdminForm, AuthorAdminForm, ArchivesAdminForm, MaterialAdminForm, ProcedureStepAdminForm, ScienceAreaAdminForm, ScienceAreaToExperimentAdminForm
# from .models import Experiment, Author, ProcedureStep, Archives, ScienceArea, Material, ExperimentToAuthor, ExperimentToScienceArea
from . import forms
from . import models

admin.site.site_header = "IPT Editor Access"
admin.site.site_title = "IPT Admin Site"
admin.site.index_title = "IPT Administration"
    
# admin.site.register(Experiment)
# admin.site.register(Author)
# admin.site.register(ProcedureStep)
# admin.site.register(Archives)
# admin.site.register(ScienceArea)
# admin.site.register(Material)

@admin.register(models.Experiment)
class ExperimentAdmin(admin.ModelAdmin):
    form = forms.ExperimentAdminForm
    search_fields = ["experiment_name"]


@admin.register(models.Author)
class AuthorAdmin(admin.ModelAdmin):
    
    class Experiment2AuthorTabularInline(admin.TabularInline):
        model = models.ExperimentToAuthor
        extra = 0


    form = forms.AuthorAdminForm
    actions_on_top = True
    date_hierarchy = "created_at"
    empty_value_display = _("-empty-")
    ordering = (_("-created_at"), _("-author_name"), _("-updated_at"))
    search_fields = [_("author_name")]
    # readonly_fields = ["created_at", "updated_at"]
    # filter_horizontal = ("experiments",) CANNOT WORKED, TRY LATER...
    #TODO MAKE A PREVIEW OF AUTHOR PICTURE
    list_display = [_("get_author_picture"), _("author_name"), _("created_at"), _("updated_at")]
    list_display_links = [_("author_name")]
    list_filter = (_("created_at"), _("updated_at"))
    list_per_page = settings.MAX_AUTHOR_ROWS_DISPLAY_PER_PAGE
    list_max_show_all = settings.MAX_AUTHOR_ROWS_DISPLAY_ALL
    
    fieldsets = [
        (
            _("Personal Information"),
            {
                "fields":["author_name", "is_editor"],
            },
        ),
        (
            _("Author Image"),
            {
                "fields":["author_picture"],
            },
        ),
    ]
    inlines = (
        Experiment2AuthorTabularInline,
    )


    @admin.display(
        description=_("Author's Image"),
        empty_value=_("--None--"),)
    def get_author_picture(self, author:models.Author) -> str:
        src_image = None
        if not hasattr(author, "author_picture_file"):
            src_image = settings.DEFAULT_PROFILE_IMAGE
        else:
            src_image = author.author_picture_file.archive.url # type: ignore
    
        return format_html(
            '''<img src="{}" alt="{}"style = "{}" draggable="false"/>''',
            src_image,
            _("Profile Picture of ") + author.author_name,
            settings.DEFAULT_STRING_STYLE_FOR_PREVIEW_PROFILE_IMAGE
        )


    def save_model(self, request: HttpRequest, obj: Any, form: ModelForm, change: bool) -> None:
    
        super().save_model(request, obj, form, change)
        author = obj

        cleaned_data = form.cleaned_data
        author_picture = cleaned_data["author_picture"]

        if author_picture is None:
            return

        archive = author_picture
        archive_name = Path(archive.name).stem
        size_in_bytes = archive.size
        mime_type = archive.content_type

        try:
            related_archive = author.author_picture_file
            actual_storage_archive = related_archive.archive
        except models.Archives.DoesNotExist:
            models.Archives.objects.create(
                author=author, archive=archive, archive_name=archive_name, size_in_bytes=size_in_bytes, mime_type=mime_type)
        else:
            related_archive.archive = author_picture
            related_archive.archive_name = archive_name
            related_archive.size_in_bytes = size_in_bytes
            related_archive.mime_type = mime_type

            related_archive.save(
                update_fields=[
                    "archive", "archive_name", "size_in_bytes", "mime_type",
                ]
            )
            
            if (actual_storage_archive 
                and actual_storage_archive.name 
                and actual_storage_archive.name != related_archive.archive.name):
                related_archive.archive.storage.delete(actual_storage_archive.name)
        
        return


@admin.register(models.Material)
class MaterialAdmin(admin.ModelAdmin):
    form = forms.MaterialAdminForm


@admin.register(models.Archives)
class ArchivesAdmin(admin.ModelAdmin):
    form = forms.ArchiveAdminForm
    change_form_template = "./pages/admin/archives/m_change_form.html"
    autocomplete_fields = ["experiment"]
    fieldsets = [
        (
            _("Archive's Classification"),
            {
                "fields":[
                    "classification_archive", 
                    ("experiment", "procedure_step", "author")],
                "description": _("Define Archive's relations.")
            }
        ),
        (
            _("Archive's Information"),
            {
                "fields":["archive_name", "mime_type"],
            }
        ),
        (
            _("Archive's File"),
            {
                "fields":["archive"],

            }
        ),
    ]


@admin.register(models.ScienceArea)
class ScienceAreaAdmin(admin.ModelAdmin):

    class Experiment2ScienceAreaStackedInline(admin.StackedInline):
        model = models.ExperimentToScienceArea
        form = forms.ScienceArea2ExperimentStackedInlineAdminForm
        extra = 0
        fields = [
            "experiment", "created_at", "updated_at"]
        readonly_fields = [
            "created_at", "updated_at"
        ]
        can_delete = True
        verbose_name = _("Associated Experiment")
        verbose_name_plural = _("Associated Experiments")
        ordering= ("-created_at", )
        #TODO Implement a <autocomplete_fields>
        classes = ("collapse", )
        empty_value_display = "--"


    form = forms.ScienceAreaAdminForm
    fieldsets = [
        (
            _("Science Area Information".upper()),
            {
                "fields": ["area_code", "area_name", "description"]
            },
            
        ),
        # (
        #     _("Experiments in Science Area"),
        #     {
        #         "fields": ["experiments"]
        #     },
        # )
    ]

    inlines = (Experiment2ScienceAreaStackedInline, )


@admin.register(models.ProcedureStep)
class ProcedureStepAdmin(admin.ModelAdmin):
    form = forms.ProcedureStepAdminForm


##caimandabel3309