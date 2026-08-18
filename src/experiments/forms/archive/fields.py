from typing import Any, Self

from django import forms

class TemplateMetadataMixin:
    DEFAULT_HIDDEN_CLASS = "hidden"

    is_initially_hidden: bool | None
    hidden_class:str | None
    id_outer_container:str | None
    is_group_start: bool
    group_title:str | None
    group_dict:dict[str, str] | None

    def metadata_mixin(
            self,
            *,
            is_initially_hidden:bool | None = None,
            hidden_class:str | None = None,
            id_outer_container:str | None = None,
            is_group_start:bool = False,
            group_title:str | None = None,
            group_dict:dict[str, Any] | None = None) -> Self:
        
        self.is_initially_hidden = is_initially_hidden
        self.hidden_class = hidden_class or self.DEFAULT_HIDDEN_CLASS
        self.id_outer_container = id_outer_container
        self.is_group_start = is_group_start

        if ((group_title or group_dict) 
            and not self.is_group_start):
            raise ValueError(
                f"A {TemplateMetadataMixin.__name__} that does not is a group start, then group assets must be None"
            )
        
        self.group_title = group_title
        self.group_dict = group_dict

        return self


class ArchiveModelChoiceField(TemplateMetadataMixin, 
                              forms.ModelChoiceField):
    pass