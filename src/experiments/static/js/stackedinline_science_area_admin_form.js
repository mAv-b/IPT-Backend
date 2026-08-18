const isAddStackedInlineBtnExists = () => {
    const btn = document.querySelector(
        "#experimenttosciencearea_set-group > fieldset > details .add-row .addlink"
    );
    
    return !!btn;
}

const existSomeStackedInlineElement = () => {
    const lstElements = document.querySelectorAll(
        ".dynamic-experimenttosciencearea_set > h3 .inline_label"
    );
    
    return lstElements.length > 0;
}

if(!isAddStackedInlineBtnExists() && !existSomeStackedInlineElement()) {
    const observer = new MutationObserver(() => {
        if(isAddStackedInlineBtnExists() && existSomeStackedInlineElement()) {
            const btn = document.querySelector(
                "#experimenttosciencearea_set-group > fieldset > details .add-row .addlink"
            );
            btn.addEventListener("click", cleanExperimentToScienceAreaString);
            
            cleanExperimentToScienceAreaString();
            
            observer.disconnect();
        }
    });
    
    observer.observe(document.body, {
        childList: true, subtree: true
    });
}

main();

function main() {
    const codeInputElement = document.getElementById("id_area_code");

    codeInputElement.addEventListener("input", (e)=>{
        e.target.value = e.target.value.toUpperCase();
        return;
    });

}

function cleanExperimentToScienceAreaString() {
    const allElementsStrExp2ScienceArea = document.querySelectorAll(".dynamic-experimenttosciencearea_set > h3 .inline_label");

    const lstR = [];
    for(let i = 0; i<allElementsStrExp2ScienceArea.length; i++) {
        const str = allElementsStrExp2ScienceArea[i].textContent;
        const strOp = str.split("-")
        
        let strFormated = null;
        if(strOp.length > 1) strFormated = strOp[1];
        else strFormated = strOp[0];

        lstR.push(strFormated);
    }

    lstR.forEach((str,i) => {
        allElementsStrExp2ScienceArea[i].textContent = str;
    });

    return
};