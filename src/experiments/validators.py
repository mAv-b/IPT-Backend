from pathlib import Path
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

from .utils import verify_audio, verify_video, verify_image, verify_pdf

if TYPE_CHECKING:
    from django.core.files.uploadedfile import UploadedFile

def file_validation(file:UploadedFile):
    content_type = file.content_type
    if content_type is None:
        return

    extension_file = Path(file.name).suffix.lower().replace(".","")
    if extension_file != content_type.split("/")[1]:
        raise ValidationError(
            _("File Format not correspond to mime-type of request"))
        
    if content_type.startswith("image/"):
        verify_image(file)
    elif content_type.startswith("audio/"):
        verify_audio(file)
    elif content_type.startswith("video/"):
        verify_video(file)
    elif content_type.startswith("application/pdf"):
        verify_pdf(file)

#TODO finish this verification

    