// TODO Verify label of float-tag archive classification
// TODO VERIFY THE AUTOCOMPLETE, AND IMPLEMENT
function main() {
    const formElement = document.getElementById("archives_form");

    formElement.addEventListener("archive-model-choice:update", (e) => {
        const archiveModelChoice = getExactlyOne(
            document,
            ".field-experiment.field-procedure_step.field-author"
        );
        
        const floatTagElementChild = document.getElementById("id_float-tag-classification-archive");
        if(!floatTagElementChild)
            notExistsElementByIdError("id_float-tag-classification-archive");
        
        if(e.detail.state.other){
            
            archiveModelChoice.firstElementChild.classList.add("hidden");
            floatTagElementChild.parentElement.classList.add("hidden");
            
            return;
        }

        archiveModelChoice.firstElementChild.classList.remove("hidden");
        floatTagElementChild.parentElement.classList.remove("hidden");

        floatTagElementChild.textContent = "";
        let floatTagElementText = "";

        delete e.detail.state.other;
        for(const [key, bool] of Object.entries(e.detail.state)) {
            const modelName = (key.includes("_picture"))? "author" : key;

            const modelChoiceWidget = document.getElementById(`id_${modelName}-outer-container`);
            if(!modelChoiceWidget)
                notExistsElementByIdError(`id_${modelName}-outer-container`);

            if(bool){
                floatTagElementText += `${modelName} `;

                modelChoiceWidget.classList.remove("hidden");
            }else{
                modelChoiceWidget.classList.add("hidden");

                const containerPopoverWidget = getExactlyOne(modelChoiceWidget, `.archive-search-container-popover`);
                
                if(containerPopoverWidget.classList.contains("archive-search-container-popover-down")){
                    const selectedOptionModelChoiceWidget = getExactlyOne(modelChoiceWidget, `.archive-search-selected-option`);
                    selectedOptionModelChoiceWidget.dispatchEvent(
                        new Event("click",
                            {bubbles:true}
                        )
                    );
                }

                containerPopoverWidget.classList.toggle("archive-search-container-popover-up", false);
                containerPopoverWidget.classList.toggle("archive-search-container-popover-down", false);
            }

        }

        floatTagElementChild.textContent = floatTagElementText.trim().replace(" ", " & ");

    });

    formElement.addEventListener("archive-model-choice-selected:change", (e) => {
        const dispatchedBtnElement = e.target;
        const modelChoiceType = e.detail.type;

        const widget = getExactlyOne(formElement, `#id_${modelChoiceType}`);
        const selectedOption = getExactlyOne(widget, `.archive-search-selected-option`);

        const outerSpanSelectedOption = getExactlyOne(selectedOption, `span[name="selected-${modelChoiceType}"]`);

        if(dispatchedBtnElement.classList.contains("archive-search-none-item")){
            outerSpanSelectedOption.firstElementChild.textContent = dispatchedBtnElement.firstElementChild.textContent;
            return;
        }else if(!outerSpanSelectedOption.querySelector(`span[name="${modelChoiceType}-name"]`)) {
            const spanName = document.createElement("span");
            const spanBody = document.createElement("span");

            spanName.setAttribute("name", `${modelChoiceType}-name`);
            spanBody.setAttribute("name", `${modelChoiceType}-body`);

            outerSpanSelectedOption.firstElementChild.replaceWith(spanName, spanBody);
        }

        if(modelChoiceType === "experiment") {
            const selectedNameExperimentElement = getExactlyOne(selectedOption, `span[name="experiment-name"]`);
            const clickedNameExperimentElement = getExactlyOne(dispatchedBtnElement, `span[name="experiment-name"]`);

            selectedNameExperimentElement.textContent = clickedNameExperimentElement.textContent;

            const selectedBodyExperimentElement = getExactlyOne(selectedOption, `span[name="experiment-body"]`);

            const areaCodeArrExperiment = [...dispatchedBtnElement.querySelectorAll(`span[name="area-code"]`)];

            if(areaCodeArrExperiment.length === 0){
                const noneAreaCodeSpan = document.createElement("span");
                noneAreaCodeSpan.textContent = "No Areas";
                noneAreaCodeSpan.name = "area-code";
                selectedBodyExperimentElement.replaceChildren(noneAreaCodeSpan);
            }else {
                const areaCodeSpanArr = areaCodeArrExperiment.map(areaCode => {
                    const span = document.createElement("span");
                    span.name = "area-code";
                    span.textContent = areaCode.textContent;
                    return span;
                });
                selectedBodyExperimentElement.replaceChildren(...areaCodeSpanArr);
            }

        } else if(modelChoiceType === "author"){
            const selectedNameAuthorElement = getExactlyOne(selectedOption, `span[name="author-name"]`);
            const clickedNameAuthorElemnet = getExactlyOne(dispatchedBtnElement, `span[name="author-name"]`);

            selectedNameAuthorElement.textContent = clickedNameAuthorElemnet.textContent;

            const selectedBodyAuthorElement = getExactlyOne(selectedOption, `span[name="author-body"]`);
            
            const clickedImgAuthorElement = getExactlyOne(dispatchedBtnElement, `img`);
            if(!selectedBodyAuthorElement.querySelector(`:scope > img`)) {
                const imgElement = document.createElement('img');

                imgElement.src = clickedImgAuthorElement.src;
                imgElement.alt = `${clickedNameAuthorElemnet.textContent}'s photo`;
                selectedBodyAuthorElement.prepend(imgElement);
            }else {
                const selectedImgAuthorElement = getExactlyOne(selectedBodyAuthorElement, `:scope > img`);
                
                selectedImgAuthorElement.alt = `${clickedNameAuthorElemnet.textContent}'s photo`;
                selectedImgAuthorElement.src = clickedImgAuthorElement.src;
            }
            
            const clickedIsEditorAuthorElement = getExactlyOne(dispatchedBtnElement, `span[name="author-is-editor"]`);
            if(!selectedBodyAuthorElement.querySelector(`span[name="author-is-editor"]`)) {
                const spanElement = document.createElement("span");
                spanElement.setAttribute("name", "author-is-editor");
                spanElement.textContent = clickedIsEditorAuthorElement.textContent;
                selectedBodyAuthorElement.appendChild(spanElement);
            }else {
                const selectedIsEditorAuthorElement = getExactlyOne(selectedBodyAuthorElement, `span[name="author-is-editor"]`);
                selectedIsEditorAuthorElement.textContent = clickedIsEditorAuthorElement.textContent;
            }

        } else if(modelChoiceType === "procedure_step") {
            const selectedNameProcedureStepElement = getExactlyOne(selectedOption, `span[name="procedure_step-name"]`);
            const clickedNameProcedureStepElement = getExactlyOne(dispatchedBtnElement, `span[name="procedure_step-name"]`);

            selectedNameProcedureStepElement.textContent = clickedNameProcedureStepElement.textContent;

            const selectedBodyProcedureStepElement = getExactlyOne(selectedOption, `span[name="procedure_step-body"]`);
            const selectedExperimentProcedureStepElement = getExactlyOne(selectedBodyProcedureStepElement, `span[name="procedure_step-experiment"]`);
            const selectedOrderProcedureStepElement = getExactlyOne(selectedOption, `span[name="procedure_step-order"]`);

            const clickedExperimentProcedureStepElement = getExactlyOne(dispatchedBtnElement, `span[name="procedure_step-experiment"]`);
            const clickedOrderProcedureStepElement = getExactlyOne(dispatchedBtnElement, `span[name="procedure_step-order"]`);

            selectedExperimentProcedureStepElement.textContent = clickedExperimentProcedureStepElement.textContent;
            selectedOrderProcedureStepElement.textContent = clickedOrderProcedureStepElement.textContent;
        }

        selectedOption.dispatchEvent(new Event("click", {bubbles:true}));

    });

    initializeArchiveClassification();
    initializeArchiveModelChoiceWidget("experiment");
    initializeArchiveModelChoiceWidget("author");
    initializeArchiveModelChoiceWidget("procedure_step");

}

const updateMimeTypeFileInput = (mimeType) => {
    const mimeTypeInput = document.getElementById("id_mime_type");
    mimeTypeInput.value = mimeType;
    return mimeTypeInput.value;
}

main();