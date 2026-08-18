
function inferInlineTabularInFieldSet() {
    const allFieldAuthorNameElement = document.getElementsByClassName("field-author_name");
    const fieldAuthorNameElement = allFieldAuthorNameElement[0];

    const fieldSetPersonalInformationElement = fieldAuthorNameElement.parentElement;

    const experimentsToAuthorInlineTabularElement = document.getElementById("experimenttoauthor_set-group");
    fieldAuthorNameElement.after(experimentsToAuthorInlineTabularElement);
    return;
}

inferInlineTabularInFieldSet();