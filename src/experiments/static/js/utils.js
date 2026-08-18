function getExactlyOne(reference, selector){
    const elementQueryList = reference.querySelectorAll(selector);
    
    if(elementQueryList.length !== 1) {
        throw new Error(`Must have exactly one element within: ${selector}`);
    }

    return elementQueryList[0];
};

function notExistsElementByIdError(id){
    throw new Error(`Does not exists an element within that id: ${id}`);
}