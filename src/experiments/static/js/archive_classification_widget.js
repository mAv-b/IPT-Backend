function initializeArchiveClassification(){
    const archiveClassificationElement = document.getElementById("id_classification_archive");
    if(!archiveClassificationElement)
        notExistsElementByIdError("id_classification_archive");

    archiveClassificationElement.addEventListener("change", (e)=> {
        const widget = e.currentTarget;
        const option = e.target.closest(`[name="classification_archive"]`);

        if(!option) {
            return;
        }

        //ADD UTIL FOR THIS
        const classificationArchivesInputs = widget.querySelectorAll(`[name="classification_archive"]`);

        let isOther = true;
        const currentArchiveClassificationState = [...classificationArchivesInputs].reduce(
            (obj, input) => {
                if(input.checked) isOther = false;
                obj[input.value] = input.checked;
                return obj;
            }, {}
        );

        let finalState = currentArchiveClassificationState;

        if(isOther) {
            finalState.other = true;
            classificationArchivesInputs.forEach(input => input.checked = input.value === "other");
        }else {
            const isValidState = checkCurrentState(currentArchiveClassificationState);
            if(!isValidState) {
                classificationArchivesInputs.forEach(input => {
                    const r = input.value === option.value;
                    input.checked = r;
                    finalState[input.value] = r;
                });
            };
        }

        widget.dispatchEvent(
            new CustomEvent("archive-model-choice:update", {
                bubbles: true,
                detail: {
                    state:finalState
                }
            })
        );
    });
}

const checkCurrentState = (state) => {
    if(state["author_picture"]){
        if(state["experiment"] || state["procedure_step"] || state["other"]) {
            return false;
        }
    } else if(state["other"]) {
        if(state["experiment"] || state["procedure_step"]){
            return false;
        }
    }else if(!state["experiment"] && !state["procedure_step"]){
        return false;
    }
    return true;
}