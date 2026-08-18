function initializeArchiveModelChoiceWidget(widgetName) {
    const archiveModelChoiceElement = document.getElementById(`id_${widgetName}-outer-container`);
    if (!archiveModelChoiceElement)
        notExistsElementByIdError(`id_${widgetName}-outer-container`);

    const selectedOptionElement = getExactlyOne(archiveModelChoiceElement, `.archive-search-selected-option`);
    const archiveSearchContainerPopover = getExactlyOne(archiveModelChoiceElement, `.archive-search-container-popover`);

    selectedOptionElement.addEventListener("click", selectedOptionElementClickEventHandler);
    
    archiveModelChoiceElement.addEventListener("archive-search-container-popover:close", popoverCloseEventHandler);
    archiveModelChoiceElement.addEventListener("archive-search-container-popover:open", popoverOpenEventHandler);
    
    archiveModelChoiceElement.addEventListener(`archive-search-container-popover:change-clickout-popover`, (e)=>{
        if(e.detail.addListenner){
            document.addEventListener("click", clickOutPopoverEventHandler);
        }else {
            document.removeEventListener("click", clickOutPopoverEventHandler);

            if(!e.detail.isClosing)
                selectedOptionElement.dispatchEvent(new Event("click", {bubbles:true}));
        };
        
    });

    const initialSelectedOptionElement = getExactlyOne(archiveModelChoiceElement, `.archive-search-list button[selected]`);

    initialSelectedOptionElement.dispatchEvent(
        new CustomEvent(
            "archive-model-choice-selected:change", {
                bubbles: true,
                detail: {
                    "type":widgetName,
                }
            }
        )
    );

    const clickOutPopoverEventHandler = (innerEvent) => {
        const target = innerEvent.target;
        const popover = archiveSearchContainerPopover;

        if(!popover.contains(target)) {
            archiveModelChoiceElement.dispatchEvent(new CustomEvent(
                "archive-search-container-popover:change-clickout-popover",
                {
                    bubbles:true,
                    detail: {
                        addListenner: false,
                        isClosing: false,
                    }
                }
            ));
        };
    };
}

const popoverCloseEventHandler = (e) => {
    const widget = e.currentTarget;

    const element = getExactlyOne(widget, ".archive-search-container-popover");

    // element.style.zIndex = -1;
    element.classList.remove("archive-search-container-popover-down");
    element.classList.add("archive-search-container-popover-up");

    e.stopPropagation();

    setTimeout(()=>{
        widget.dispatchEvent(new CustomEvent(
            "archive-search-container-popover:change-clickout-popover",
            {
                bubbles:true,
                detail:{
                    addListenner: false,
                    isClosing: true,
                }
            }
        ));
    }, 200);
}

const popoverOpenEventHandler = (e) => {
    const widget = e.currentTarget;
    
    const element = getExactlyOne(widget, ".archive-search-container-popover");

    element.classList.add("archive-search-container-popover-down");
    element.classList.remove("archive-search-container-popover-up");

    e.stopPropagation();

    setTimeout(()=>{
        // element.style.zIndex = 1;
        widget.dispatchEvent(new CustomEvent(
            "archive-search-container-popover:change-clickout-popover",
            {
                bubbles:true,
                detail:{
                    addListenner: true,
                    isClosing: false,
                }
            }
        ));
    }, 200);
}

const selectedOptionElementClickEventHandler = (e) => {
    e.preventDefault();

    const element = e.currentTarget;
    element.classList.add("archive-search-option-click");

    const iconDropdownElement = getExactlyOne(element, ".archive-search-dropdown-icon");

    if (iconDropdownElement.childElementCount !== 1)
        throw new Error("iconDropDownElement must have only one child, the icon itself");
    
    const iconElement = iconDropdownElement.firstElementChild;
    if (iconElement.active) {
        iconElement.classList.remove("rotate-180deg-icon");
        iconElement.classList.add("inverse-rotate-180deg-icon");

        iconElement.dispatchEvent(
            new CustomEvent(
                "archive-search-container-popover:close", {
                bubbles: true,
            }
            )
        );

        iconElement.active = false;

    } else {
        iconElement.classList.add("rotate-180deg-icon");
        iconElement.classList.remove("inverse-rotate-180deg-icon");

        iconElement.dispatchEvent(
            new CustomEvent(
                "archive-search-container-popover:open", {
                bubbles: true,
            }
            )
        );

        iconElement.active = true;
    }

    e.stopPropagation();

    setTimeout(()=>{
        element.classList.remove("archive-search-option-click");
    }, 300);

}

function selectArchiveOptionHandler(e) {
    const optBtn = e.currentTarget;
    const type = optBtn.dataset.optionType;

    const widget = optBtn.closest(`#id_${type}`);

    const selectFormElement = getExactlyOne(widget, `select[name="${type}"]`);
    
    if(!selectFormElement)
        throw new Error(`No select element was found in model-choice ${type}`);

    const clickedOptionForm = getExactlyOne(selectFormElement, `option[value="${optBtn.value}"][data-option-type="${type}"]`);

    let currentSelectedBtnOption = optBtn.closest(`.archive-search-list`);
    if(!currentSelectedBtnOption)
        throw new Error(`The clicked option of ${type}, is not in a archive search list`);

    currentSelectedBtnOption = getExactlyOne(currentSelectedBtnOption, `button[selected][data-option-type="${type}"]`);

    const currentSelectedOptionForm = getExactlyOne(selectFormElement, `option[selected][data-option-type="${type}"]`);

    currentSelectedBtnOption.toggleAttribute("selected");
    optBtn.toggleAttribute("selected");

    currentSelectedOptionForm.toggleAttribute("selected");
    clickedOptionForm.toggleAttribute("selected");

    currentSelectedOptionForm.selected = false;
    clickedOptionForm.selected = true;

    selectFormElement.value = optBtn.value;

    optBtn.dispatchEvent(
        new CustomEvent(
            "archive-model-choice-selected:change", {
                bubbles: true,
                detail: {
                    "type":type,
                }
            }
        )
    );
}