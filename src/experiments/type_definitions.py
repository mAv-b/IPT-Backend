from typing import Any, Callable, Sequence, Literal, TypeAlias, TypeGuard

NameWidgetArchiveModelChoice: TypeAlias = Literal[
    "experiment", 
    "author", 
    "procedure_step",
]

def is_archive_model_choice_widget_name(
    value:str
) -> TypeGuard[NameWidgetArchiveModelChoice]:

    return value in (
        "experiment", 
        "author", 
        "procedure_step",
    )