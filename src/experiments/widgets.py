from typing import Any, Sequence
from pathlib import Path

from django import forms

from . import models
from . import utils
from .type_definitions import is_archive_model_choice_widget_name, NameWidgetArchiveModelChoice

from ipt_backend import settings

class AuthorPictureWidget(forms.ClearableFileInput):
    template_name = "./widgets/clearable_image_file_input.html"

    class Media:
        css = {
            "all": ["css/author_picture_widget.css"],
        }
        js = {
            forms.widgets.Script( # type: ignore
                "js/author_picture_widget.js",
                **{
                    "defer": True,
                },
            ),
        }
    

    def __init__(self, attrs: dict[str, Any] | None = None) -> None:
        attrs = attrs or {}

        attrs["id"] = "id_input-image"
        attrs["img_id"] = "id_image-author"
        attrs["outer_container_id"] = "outer-container-profile-image"
        attrs["inner_container_id"] = "inner-container-profile-image"
        super().__init__(attrs)


    def get_context(self, name: str, value: Any, attrs: dict[str, Any] | None) -> dict[str, Any]:
        context = super().get_context(name, value, attrs)
    
        widget = context["widget"]

        if widget["is_initial"]:
            widget["attrs"]["input_file_url"] = value.url
        else:
            widget["attrs"]["input_file_url"] = settings.DEFAULT_PROFILE_IMAGE

        return context


class ArchiveFileFieldWidget(forms.ClearableFileInput):
    template_name = "./widgets/m_clearable_file_input.html"

    detail_container:dict[str, Any]
    preview_container:dict[str, Any]
    
    class Media:
        css = {
            "all": ["css/file_input_widget.css"],
        }
        js = {
            forms.widgets.Script( # type: ignore
                "js/file_input_widget.js",
                **{
                    "defer": True,
                },
            )
        }
        

    def __init__(self, attrs: dict[str, Any] | None = None) -> None:
        attrs = attrs or {}

        attrs["id"] = "id_archive"

        self.detail_container = {
            "attrs": {
                "id":"id_detail-container",
            },
        }

        self.preview_container = {
            "attrs": {
                "id":"id_preview-file-container",
            }
        }

        super().__init__(attrs)


    def get_context(self, name: str, value: Any, attrs: dict[str, Any] | None) -> dict[str, Any]:
        context = super().get_context(name, value, attrs)

        widget = context["widget"]
        widget_value = widget['value']
        is_initial = widget['is_initial']


        widget["attrs"]["data-field-name"] = name
        widget["attrs"]["data-field-initial"] = str(widget["is_initial"]).lower()
        widget["attrs"]["data-file-url"] = ""

        body = None
        if is_initial:

            widget["attrs"]["data-file-url"] = value.url

            archive_instance = widget_value.instance
            if archive_instance is not None:
                body = {
                    "archive_name": Path(archive_instance.archive.name).name,
                    "archive_size": archive_instance.size_in_bytes,
                    "archive_mime_type": archive_instance.mime_type,
                    "archive_url": archive_instance.archive.url,
                }

        if body is None:
            classes_str_detail_container = self.detail_container.get("class", "").split()
            classes_str_preview_container = self.preview_container.get('class', '').split()

            if 'hidden' not in classes_str_detail_container:
                classes_str_detail_container.append('hidden')

            if 'hidden' not in classes_str_preview_container:
                classes_str_preview_container.append('hidden')

            self.preview_container['attrs']['class'] = " ".join(classes_str_preview_container)
            self.detail_container['attrs']['class'] = " ".join(classes_str_detail_container)
            

        widget['body'] = body

        print(body, is_initial, self.preview_container, self.detail_container)
        
        context["preview_container"] = self.preview_container
        context["detail_container"] = self.detail_container

        return context


class ArchiveModelChoice(forms.Select):
    template_name = "./widgets/m_archive_select.html"
    option_template_name = "./m_archive_select_option.html"
    default_option_template_name = "./default_archive_select_option.html"

    current_instance: models.Experiment | models.ProcedureStep | models.Author | None

    DEFAULT_CLASS_WIDGET = "archive-select"
    DEFAULT_CLASS_OPTION = "archive-search-option"
    DEFAULT_CLASS_SELECTED_OPTION = "archive-search-selected-option"
    DEFAULT_CLASS_SEARCH_INPUT = "archive-search-input"
    DEFAULT_CLASS_SEARCH_LIST = "archive-search-list"
    DEFAULT_CLASS_SEARCH_LIST_CONTAINER = "archive-search-container-popover"
    DEFAULT_CLASS_SEARCH_GROUP_CONTAINER = "archive-search-group-container"

    DEFAULT_ON_CLICK_HANLDER = "selectArchiveOptionHandler(event)"

    class Media:
        css = {
            "all": ["css/archive_model_choice_widget.css"],
        }
        js = {
            forms.widgets.Script( # type: ignore
                "js/archive_model_choice_widget.js",
                **{
                    "defer": True,
                }
            )
        }

    def __init__(self, attrs: dict[str, Any] | None = None, choices: Sequence[tuple[Any, Any]] = ()) -> None:
        self.current_instance = None

        attrs = attrs or  {} #TODO Check consistent data type
        attrs["class"] = self.DEFAULT_CLASS_WIDGET

        super().__init__(attrs, choices)


    def create_option(self, name: str, value: Any, label: int | str, selected: bool, index: int, subindex: int | None = None, attrs: dict[str, Any] | None = None) -> dict[str, Any]:
        option = super().create_option(name, value, label, selected, index, subindex, attrs)

        attrs = option["attrs"]
        if attrs is None:
            attrs = {}
        
        attrs.update({
            "class": self.DEFAULT_CLASS_OPTION,
            "onclick": self.DEFAULT_ON_CLICK_HANLDER,
            "data-option-type": name,
            "type": "button",
        })

        if option["value"]:
            opt_value = option["value"]
            opt_instance = opt_value.instance

            if isinstance(opt_instance, models.Experiment):
                option.update(
                    utils.setup_experiment_search_option_archive_instance(opt_instance))
            elif isinstance(opt_instance, models.Author):
                option.update(
                    utils.setup_author_search_option_archive_instance(opt_instance))
            elif isinstance(opt_instance, models.ProcedureStep):
                option.update(
                    utils.setup_procedure_step_search_option_archive_instance(opt_instance))
            else:
                ValueError(
                    f"{opt_instance} must be an instance of {models.Experiment.__name__}, {models.Author.__name__}, or {models.ProcedureStep.__name__}"
                )
        else:
            attrs["class"] += " archive-search-none-item"

        return option
    

    def get_context(self, name: str, value: Any, attrs: dict[str, Any] | None) -> dict[str, Any]:
        context = super().get_context(name, value, attrs)

        widget = context['widget']

        if not is_archive_model_choice_widget_name(name):
            raise TypeError(
                f"{self.__class__.__name__!r} must have a name in {NameWidgetArchiveModelChoice.__str__()!r}")

        if self.current_instance is not None: ## DOES NOT NEED PASS A INSTANCE, WIDGET ALREADY HAVE IN  WIDGET.VALUE.INSTANCE
            widget['current_data'] = utils.create_current_archive_select_instance(name, self.current_instance)
        else:
            widget['current_data'] = {}

        context["default_option_template"] = self.default_option_template_name

        context["archive_selected_option"] = {
            "attrs": {
                "class": self.DEFAULT_CLASS_SELECTED_OPTION,
                "type": "button",
            }
        }

        context["archive_search_list_container"] = {
            "attrs": {
                "class": self.DEFAULT_CLASS_SEARCH_LIST_CONTAINER
            }
        }

        context["archive_search_input"] = {
            "attrs": {
                "class": self.DEFAULT_CLASS_SEARCH_INPUT
            }
        }

        context["archive_search_list"] = {
            "attrs": {
                "class": self.DEFAULT_CLASS_SEARCH_LIST
            }
        }

        context["search_group_container"] = {
            "attrs": {
                "class": self.DEFAULT_CLASS_SEARCH_GROUP_CONTAINER
            }
        }

        return context #TODO DELETE OR VERIFY THIS


class ArchiveClassificationCustomSelectWidget(forms.CheckboxSelectMultiple):
    template_name = "./widgets/archive_classification_multiple_select.html"
    option_template_name = "./archive_classification_input_option.html"

    class Media:
        css = {
            "all": ["css/archive_classification_widget.css"],
        }
        js = {
            forms.widgets.Script(
                "js/archive_classification_widget.js",
                **{
                    "defer": True,
                }
            )
        }

    def __init__(self, attrs:dict[str, Any] | None = None, choices:Sequence[tuple[Any, Any]] = (), option_help_texts:dict[str, str] | None = None) -> None:
        super().__init__(attrs, choices)
        self.option_help_texts = option_help_texts or {}
        self.class_name_option_help_text = "classification_option_container"

    
    def get_context(self, name: str, value: Any, attrs: dict[str, Any] | None) -> dict[str, Any]:
        context = super().get_context(name, value, attrs)

        for group_name, options, index in context["widget"]["optgroups"]:
            for option in options:
                option["option_class"] = self.class_name_option_help_text
                option["help_text"] = self.option_help_texts.get(
                    str(option["value"]), "")

        return context