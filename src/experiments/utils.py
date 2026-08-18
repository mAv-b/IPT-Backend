from typing import TYPE_CHECKING, Literal
from datetime import timedelta

from PIL import Image, UnidentifiedImageError
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from django.utils import timezone

from . import models

from ipt_backend import settings

if TYPE_CHECKING:
    from .models import Archives, Experiment, Author

def get_directory_path(instance:Archives, filename:str) -> str:
    file_extension = instance.mime_type.split("/")[1]

    if instance.author is not None:
        return "authors/{0}/{1}.{2}".format(
            instance.author.uuid, instance.archive_name, file_extension)
    elif instance.experiment is not None:
        if instance.procedure_step is None:
            return "experiments/{0}/{1}.{2}".format(
                instance.experiment.uuid, instance.archive_name, file_extension)
        
        return "experiments/{0}/procedure_steps/{1}/{2}.{3}".format(
            instance.experiment.uuid, instance.procedure_step.uuid, instance.archive_name, file_extension)
    else:
        return f"others/{instance.archive_name}.{file_extension}"
    

def get_experiments_choices(model_experiment:type[Experiment]) -> list[tuple[str, str]]:
    all_experiments = model_experiment.objects.all()

    i, r = 1, []
    for experiment in all_experiments:
        r.append(
            (str(i), str(experiment.experiment_name))
        )
    
    return r


def verify_image(img_file):
    try:
        image = Image.open(img_file)
        image.verify()
    except UnidentifiedImageError:
        raise ValidationError(
            _("File is not a valid image")
        )
    except (OSError, SyntaxError):
        raise ValidationError(
            _("The image is incomplete or invalid")
        )
    finally:
        img_file.seek(0)


def verify_pdf(pdf_file):
    try:
        reader = PdfReader(pdf_file, strict=True)
        if reader.is_encrypted:
            raise ValidationError(
                _("The pdf are encrypted by a password")
            )
        
        if len(reader.pages) == 0:
            raise ValidationError(
                _("The pdf has no pages")
            )
    except PdfReadError:
        raise ValidationError(
            _("The archive is incomplete or is incompleted")
        )
    except Exception:
        raise ValidationError(
            _("Is not possible read the pdf")
        )
    finally:
        pdf_file.seek(0)


def verify_audio(audio_file):
    pass #TODO Implement this verification with ffprobe


def verify_video(video_file):
    pass #TODO Implement this verification with ffprobe


def get_greater_less_str_unit_time(timestamp:timedelta):
    if timestamp.days // (30*12):
        return _(f"{timestamp.days // (30*12)} years ago")
    elif timestamp.days // 30:
        return _(f"{timestamp.days // 30} months ago")
    elif timestamp.days // 7:
        return _(f"{timestamp.days // 7} weeks ago")
    elif timestamp.days:
        return _(f"{timestamp.days} days ago")
    elif timestamp.seconds // (60*60):
        return _(f"{timestamp.seconds // (60*60)} hours ago")
    elif timestamp.seconds // 60:
        return _(f"{timestamp.seconds // 60} minutes ago")
    else:
        return _(f"{timestamp.seconds} seconds ago")


def setup_experiment_search_option_archive_instance(instance:models.Experiment):
    return {
        "created_at": instance.created_at.strftime(f"%d %b. %Y"),
        "updated_at": get_greater_less_str_unit_time(timezone.now() - instance.updated_at),
        "experiment_name": instance.experiment_name,
        "experiment_difficult": instance.experiment_difficult,
        "experiment_is_visible": instance.is_visible,
        "experiment_is_ipt": instance.is_ipt_experiment,
        "experiment_science_area": instance.science_areas # type: ignore 
            if instance.science_areas.exists() else None, # type: ignore
    }


def setup_author_search_option_archive_instance(instance:models.Author):
    author_picture = None
    try:
        author_picture = instance.author_picture_file.archive.url # type: ignore
    except models.Archives.DoesNotExist:
        author_picture = settings.DEFAULT_PROFILE_IMAGE

    return {
        "created_at": instance.created_at.strftime(f"%d %b. %Y"),
        "updated_at": get_greater_less_str_unit_time(timezone.now() - instance.updated_at),
        "author_name": instance.author_name,
        "author_is_editor": instance.is_editor,
        "author_picture": author_picture
    }


def setup_procedure_step_search_option_archive_instance(instance:models.ProcedureStep):
    return {
        "created_at": instance.created_at.strftime(f"%d %b. %Y"),
        "updated_at": get_greater_less_str_unit_time(timezone.now() - instance.updated_at),
        "step_name": instance.step_name,
        "experiment": instance.experiment if instance.experiment_id is not None  else None # type: ignore
    }


def create_current_archive_select_instance(
    type:Literal["experiment"] | Literal["procedure_step"] | Literal["author"],
    instance:models.Experiment | models.ProcedureStep | models.Author
):
    if type == "experiment":
        if not isinstance(instance, models.Experiment):
            raise ValueError(
                f"For type:{type}, current instance {instance.__str__()} is not an instance of {models.Experiment.__name__}")

        science_areas_relation = getattr(instance, "science_areas", None)
        
        return {
            "name": instance.experiment_name,
            "body": {
                "science_areas": (
                    [science_area.area_code for science_area in science_areas_relation.all()] 
                    if science_areas_relation is not None 
                    else []
                ),
            }
        }
    
    elif type == "procedure_step":
        if not isinstance(instance, models.ProcedureStep):
            raise ValueError(
                f"For type:{type}, the current instance {instance.__str__()} is not an instance of {models.ProcedureStep.__name__}")

        return {
            "name": instance.step_name,
            "body": {
                "experiment": instance.experiment,
                "order": instance.step_order,
            }
        }
    
    elif type == "author":
        if not isinstance(instance, models.Author):
            raise ValueError(
                f"For type:{type}, the current instance {instance.__str__()} is not an instance of {models.Author.__name__}")

        author_picture = getattr(instance, "author_picture_file", None)

        return {
            "name": instance.author_name,
            "body": {
                "author_picture": author_picture.archive.url if author_picture is not None else None,
                "is_editor": instance.is_editor,
            }
        }