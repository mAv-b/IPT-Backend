from .archive import ArchiveAdminForm
from .author import AuthorAdminForm
from .experiment import ExperimentAdminForm
from .material import MaterialAdminForm
from .procedure_step import ProcedureStepAdminForm
from .science_area import ScienceArea2ExperimentStackedInlineAdminForm, ScienceAreaAdminForm

__all__ = [
    "ArchiveAdminForm",
    "AuthorAdminForm",
    "ExperimentAdminForm",
    "MaterialAdminForm",
    "ProcedureStepAdminForm",
    "ScienceAreaAdminForm",
    "ScienceArea2ExperimentStackedInlineAdminForm",
]