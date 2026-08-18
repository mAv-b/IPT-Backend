import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from .utils import get_directory_path


class ScienceArea(models.Model):

    id = models.BigAutoField(
        primary_key=True, editable=False)
    
    area_code = models.CharField(
        max_length=4, null=False, blank=False,)
    
    area_name = models.CharField(
        max_length=255, null=False, blank=False)
    
    description = models.TextField(
        null=False, blank=True)
    
    experiments = models.ManyToManyField(
        "Experiment", through="ExperimentToScienceArea", related_name="science_areas")
    
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self) -> str:
        return f"{self.area_code} - {self.area_name}"


class Experiment(models.Model):
    class ExperimentDifficulties(models.Model):
        D1 = "1", _("D1")
        D2 = "2", _("D2")
        D3 = "3", _("D3")
        D4 = "4", _("D4")
        D5 = "5", _("D5")

    EXPERIMENT_DIFFICULTIES = [
        ("D1", "1"),
        ("D2", "2"),
        ("D3", "3"),
        ("D4", "4"),
        ("D5", "5"),
    ]

    uuid = models.UUIDField(
        primary_key=True, editable=False, default=uuid.uuid4)
    
    experiment_slug = models.SlugField(
        null=False, unique=True)
    
    experiment_name = models.CharField(
        max_length=255, null=False, blank=False, unique=True)
    
    experiment_time = models.DurationField(
        null=False, blank=False)
    
    experiment_difficult = models.CharField(
        default=ExperimentDifficulties.D1, null=False, blank=False, choices=EXPERIMENT_DIFFICULTIES,) # type: ignore
    
    experiment_description = models.TextField(
        blank=False, null=False,)

    experiment_model = models.TextField(
        blank=False, null=False,)

    experiment_result = models.TextField(
        blank=False, null=False,)

    # Checar se isso não é descartavel
    experiment_executations = models.PositiveIntegerField(
        default=0, editable=False,)

    experiment_cautions = models.TextField(
        blank=True, null=True,)

    is_visible = models.BooleanField(default=True)

    is_ipt_experiment = models.BooleanField(default=False)

    # Adicionar uma validação de acordo com a resposta do field anterior
    ipt_date = models.DateField(
        auto_now=False, auto_now_add=False, null=True)

    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self) -> str:
        return f"{self.experiment_name}"
    

class ExperimentToScienceArea(models.Model):
    
    id = models.BigAutoField(primary_key=True, editable=False)

    experiment = models.ForeignKey(
        Experiment, on_delete=models.RESTRICT)
    
    science_area = models.ForeignKey(
        ScienceArea, on_delete=models.RESTRICT)
    
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self) -> str:
        return f"{self.science_area.area_code}-{self.experiment.experiment_name}"

    
    class Meta:
        db_table = "Experiment_Science_Area"
        constraints = [
            models.UniqueConstraint(
                fields=("experiment","science_area"),
                name="unique_science_area_experiment"
            )
        ]


class Author(models.Model):

    uuid = models.UUIDField(primary_key=True, editable=False, default=uuid.uuid4)

    author_name = models.CharField(
        max_length=255, null=False, blank=False, unique=True,
        help_text=_("Please Insert Author's Fullname."),)

    is_editor = models.BooleanField(null=False, default=False)

    experiments = models.ManyToManyField(Experiment, through="ExperimentToAuthor")

    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self) -> str:
        return f"{self.author_name}"


class Archives(models.Model):

    uuid = models.UUIDField(
        primary_key=True, editable=False, default=uuid.uuid4)
    
    experiment = models.ForeignKey(
        Experiment, on_delete=models.PROTECT, null=True, blank=True, related_name="experiments_photos")

    procedure_step = models.ForeignKey(
        "ProcedureStep", on_delete=models.PROTECT, null=True, blank=True, related_name="procedure_step_photos")

    author = models.OneToOneField(
        Author, on_delete=models.PROTECT, related_name="author_picture_file", null=True, blank=True)

    order = models.IntegerField(null=True, blank=True)

    archive_name = models.CharField(
        max_length=255, null=False, blank=False, unique=True)
    
    archive = models.FileField(
        upload_to=get_directory_path, blank=True, null=False)

    size_in_bytes = models.BigIntegerField(
        editable=True, null=False)
    
    mime_type = models.CharField(
        max_length=255, null=False, blank=False,
        help_text="Verify the MIME-Type of file")
    
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self) -> str:
        return f"{self.archive_name} --- {self.mime_type} --- {self.created_at}"
    
    class Meta:
        constraints = [
            models.CheckConstraint(
                name="archive_possible_classification",
                condition=(
                    models.Q(
                        experiment__isnull=True,
                        procedure_step__isnull=True,
                        author__isnull=True
                    )
                    | models.Q(
                        experiment__isnull=True,
                        procedure_step__isnull=True,
                        author__isnull=False
                    )
                    | models.Q(
                        experiment__isnull=True,
                        procedure_step__isnull=False,
                        author__isnull=True
                    )
                    | models.Q(
                        experiment__isnull=False,
                        procedure_step__isnull=False,
                        author__isnull=True
                    )
                    | models.Q(
                        experiment__isnull=False,
                        procedure_step__isnull=True,
                        author__isnull=True
                    )
                )
            )
        ]


class Material(models.Model):

    uuid = models.UUIDField(
        primary_key=True, editable=False, default=uuid.uuid4)
    
    material_name = models.CharField(
        max_length=255, blank=False, null=False, unique=True)
    
    material_description = models.TextField(
        blank=True, null=False)
    
    material_image = models.OneToOneField(
        Archives, on_delete=models.PROTECT)
    
    experiments = models.ManyToManyField(Experiment, through="ExperimentToMaterial")

    created_at = models.DateTimeField(auto_now_add=True, editable=False)

    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self) -> str:
        return f"{self.material_name} - {self.created_at}"


class ExperimentToMaterial(models.Model):

    id = models.BigAutoField(primary_key=True)

    experiment = models.ForeignKey(
        Experiment, on_delete=models.RESTRICT)
    
    material = models.ForeignKey(
        Material, on_delete=models.RESTRICT)
    
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self) -> str:
        return f"{self.material.material_name}__{self.experiment.experiment_name}"


    class Meta:
        db_table = "Experiment_Material"


class ProcedureStep(models.Model):

    id = models.BigAutoField(primary_key=True, editable=False)

    experiment = models.ForeignKey(
        Experiment, on_delete=models.PROTECT, related_name="procedure_steps")
    
    step_order = models.IntegerField(
        null=False, blank=False,)
    
    step_name = models.CharField(max_length=255, null=False, blank=False)

    step_description = models.TextField(
        null=False, blank=False)

    step_observation = models.TextField(
        null=False, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self) -> str:
        return f"{self.step_name} - order:{self.step_order}; in:({self.experiment.experiment_name})"


class ExperimentToAuthor(models.Model):

    id = models.BigAutoField(primary_key=True, editable=False)

    experiment = models.ForeignKey(Experiment, on_delete=models.RESTRICT)

    author = models.ForeignKey(Author, on_delete=models.RESTRICT)

    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    def __str__(self) -> str:
        return f"{self.author.author_name} -- {self.experiment.experiment_name}"


    class Meta:
        db_table = "Experiment_Author"
