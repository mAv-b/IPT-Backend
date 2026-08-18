from django import forms
from django.utils.translation import gettext as _

from ... import widgets
from ... import models

from ipt_backend import settings

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