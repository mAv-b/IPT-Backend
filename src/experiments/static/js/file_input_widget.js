function initializeFileWidget() {
    const fileWidget = document.getElementById("m_file_input_container");
    if(!fileWidget){
        notExistsElementByIdError("m_file_input_container");
    };

    const inputFileElement = document.getElementById("id_archive");
    if(!inputFileElement) {
        notExistsElementByIdError("id_archive");
    };

    fileWidget.addEventListener("file-input-icon:change", (e)=>{
        const widget = e.currentTarget;

        let key;
        switch(e.detail.iconType){
            case "image":
                key = "icon-image";
                break;
            case "video":
                key = "icon-video";
                break;
            case "audio":
                key = "icon-audio";
                break;
            case "pdf":
                key = "icon-pdf";
                break;
            case "file":
                key = "icon-file";
                break;
            default:
                key = "icon-upload";
        }

        const iconContainer = getExactlyOne(widget, `label:has(#id_archive) > div:has(> svg)`);
        
        const currentSvgElement = getExactlyOne(iconContainer, `svg`);
        const templateElement = getExactlyOne(iconContainer, `#${key}`);
        
        const newSvgElement = templateElement.content.cloneNode(true);
        
        currentSvgElement.replaceWith(newSvgElement);
    });

    fileWidget.addEventListener("loading:change-state", (e) => {
        const widget = e.currentTarget;

        const loadingStateLabel = e.detail.loadingStateLabel;
        const loadingElement = getExactlyOne(widget, `div[name="loadingContainer"]`);

        loadingElement.setStateLoading(loadingStateLabel);
    });

    inputFileElement.addEventListener("change", onInputLoadedHandler);

    // const inputFileElement = document.getElementById("id_archive");

    // inputFileElement.addEventListener("change", changeIdArchiveHandler);
    inputFileElement.addEventListener("change", updateFileInputContainer)

    const objFileConfig = fileConfig(inputFileElement, true);

    const containerPreview = insertPreviewHTMLElement(objFileConfig);
}

const getUnitTime = (t) => {
    const hours = Math.floor(t / 60**2);
    const minutes = Math.floor((t - hours*60*60) / 60);
    const seconds = t - hours*60*60 - minutes*60;

    return String(hours).padStart(2, "0").concat(
        ":", String(minutes).padStart(2, "0"), ":", String(Math.ceil(seconds)).padStart(2, "0")
    );
    
};

const getUnitTinyTime = (t) => Math.floor(t / 10**3) !== 0 ?
    String(Math.floor(t / 10**3).toFixed(2)).concat(" s") : String(t.toFixed(2)).concat(" ms");

function getAspectRatioTag(aspectRatio) {
    const ASPECT_RATIOS = {
        "0.5625": {aspectRatio: "9:16"},
        "0.667": {aspectRatio: "2:3"},
        "0.75": {aspectRatio: "3:4"},
        "0.8": {aspectRatio: "4:5"},
        "1": {aspectRatio: "1:1"},
        "1.25": {aspectRatio: "5:4"},
        "1.333": {aspectRatio: "4:3"},
        "1.5": {aspectRatio: "3:2"},
        "1.778": {aspectRatio: "21:9"},
    };

    let rKey = null;
    let previousKey = null;
    for(const key in ASPECT_RATIOS){
        if(aspectRatio < Number(key)){
            previousKey = key;
            continue;
        }else if(aspectRatio === Number(key)){
            rKey = key;
            break;
        }

        rKey = Math.abs(aspectRatio - Number(key)) > Math.abs(aspectRatio - Number(previousKey))
            ? previousKey : key;
    }

    return String(ASPECT_RATIOS[rKey].aspectRatio);

    // let currentKey = null;
    // for(const key in ASPECT_RATIOS){
    //     currentKey = !currentKey? 
    //         Number(key) : Math.abs(currentKey - Number(key)) < Math.abs(aspectRatio - Number(key)) ?
    //         Number(key) : currentKey;
    // };

    // return ASPECT_RATIOS[String(currentKey)].aspectRatio;
}

async function onInputLoadedHandler(event){
    const fileInput = event.currentTarget;

    const files = fileInput.files;
    if(files.length === 0){
        throw new Error("AIIIIIIIIINNNNN QUE DELICIA");
    }

    const file = files[0];
    const localUrlFile = URL.createObjectURL(file);
    
    let bodyDataFile = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        localUrl:localUrlFile
    };

    const loadingManager = await setLoadingContainerElement(fileInput);

    let type = null;
    if(file.type.includes("image")){
        const r = await loadFileImageHandler(localUrlFile, loadingManager);

        if(r.code){
            throw new Error(r.message);
        }

        bodyDataFile = {...bodyDataFile, ...r};

        loadingManager.dispatchChangeStateEvent("Loading image interface...");
        
        type = "image";
        loadHTMLImageFile(bodyDataFile).then(() => {
            loadingManager.delete();
        }).catch(err => {
            throw new Error(err);
        });

    }else if (file.type.includes("video")){
        const videoElement = document.createElement("video");

        const r = await loadFileVideoHandler(localUrlFile, videoElement, loadingManager);
        
        if(r.code){
            throw new Error(r.message);
        }

        loadingManager.dispatchChangeStateEvent("Loading video interface...");
        
        bodyDataFile = {...bodyDataFile, ...r};

        type = 'video';
        loadHTMLVideoFile(bodyDataFile, videoElement).then(() => {
            loadingManager.delete();
        }).catch(err => {
            throw new Error(err);
        });

    }else if (file.type.includes("audio")) {
        const audioElement = document.createElement("audio");
        
        const r = await loadFileAudioHandler({file, localUrlFile}, audioElement, loadingManager);
    
        if(r.code){
            throw new Error(r.message);
        }
        
        bodyDataFile = {...bodyDataFile, ...r};
        
        loadingManager.dispatchChangeStateEvent("Loading Audio Interface...");

        type = 'audio';
        loadHTMLAudioFile(bodyDataFile, audioElement).then(r => {
            loadingManager.delete();
        }).catch(err =>{
            throw new Error(err);
        });

    }else if (file.type.includes("application/pdf")) {

        const r = await loadiFilePdfHandler(localUrlFile, loadingManager);

        type = 'pdf';
    }else {
        type = "file";
    }

    fileInput.dispatchEvent(
        new CustomEvent(
        "file-input-icon:change", 
        {
            bubbles: true,
            detail: {
                iconType: type,
            },
        }
    ));

    // URL.revokeObjectURL(localUrlFile); DONT REVOKE BEFORE SENDING OR ANOTHER CHANGE FILE
    // MAKE WEB SAVE INFO FORM IF CHANGE PAGE TO A SAME ORIGIN PAGE
}

const setLoadingContainerElement = (fileInput) => {
    const fileInputContainer = fileInput.closest(`#m_file_input_container`);

    const container = document.createElement("div");
    const loadingIcon = document.createElement("div");

    container.setAttribute("name", "loadingContainer");
    loadingIcon.setAttribute("name", "loadingIcon");

    container.setStateLoading = (label) => {
        let labelStateLoadingElement = document.getElementById("loading-label");

        let labelExists = true
        if(!labelStateLoadingElement){
            labelExists = false;
            labelStateLoadingElement = document.createElement("span");
            labelStateLoadingElement.id = "loading-label";
        };

        labelStateLoadingElement.textContent = label;
        (!labelExists) && container.appendChild(labelStateLoadingElement);
    };

    container.appendChild(loadingIcon);
    fileInputContainer.appendChild(container);

    return {
        delete: () => container.remove(),
        dispatchChangeStateEvent: (label) => loadingIcon.dispatchEvent(
            new CustomEvent(
                "loading:change-state",
                {
                    bubbles: true,
                    detail: {
                        loadingStateLabel: label,
                    },
                }
            )
        ),
    };
};

const loadStandardFileWidgetHtml = (data) => {
    const getUnitFileSize = (bytes) => Math.floor(bytes / 1024**3) !== 0 ?
        String(Number(bytes / 1024**3).toFixed(2)).concat( "GB") : Math.floor(bytes / 1024**2) !== 0 ?
        String(Number(bytes / 1024**2).toFixed(2)).concat(" MB") : String(Number(bytes / 1024).toFixed(2)).concat(" KB");

    const fileWidgetDetailElement = document.getElementById("id_detail-container");
    const fileWidgetPreviewElement = document.getElementById("id_preview-file-container");

    if(!fileWidgetDetailElement){
        notExistsElementByIdError("id_detail-container");
    }

    if(!fileWidgetPreviewElement){
        notExistsElementByIdError("id_preview-file-container");
    }

    const {
        fileName,
        fileSize,
        fileType,
        localUrl,
    } = data;

    const detailNameElementSpan = getExactlyOne(fileWidgetDetailElement, `span[name="file-name"] > span`);
    const detailTypeElementSpan = getExactlyOne(fileWidgetDetailElement, `span[name=file-mime-type] > span`);
    const detailSizeElementSpan = getExactlyOne(fileWidgetDetailElement, `span[name="file-size"] > span`);
    const detailLocalUrlElementALink = getExactlyOne(fileWidgetDetailElement, `span[name="url-preview"] > a`);

    detailNameElementSpan.textContent = fileName;
    detailTypeElementSpan.textContent = fileType;
    detailSizeElementSpan.textContent = getUnitFileSize(fileSize);
    detailLocalUrlElementALink.textContent = "Local File Link";

    detailLocalUrlElementALink.href = localUrl;

    [...fileWidgetDetailElement.children].forEach(element => {
        const toRemove = ![
            "file-name",
            "file-mime-type",
            "file-size",
            "url-preview",
        ].includes(element.getAttribute("name"));

        if(toRemove)
            element.remove();
    });

    fileWidgetPreviewElement.replaceChildren();

    fileWidgetDetailElement.classList.remove("hidden");
    fileWidgetPreviewElement.classList.remove("hidden");

    return {
        detail: fileWidgetDetailElement,
        preview: fileWidgetPreviewElement,
    };
};

const loadHTMLAudioFile = async (data, audio) => {

    const standardFileWidget = loadStandardFileWidgetHtml(data);

    const fileWidget = standardFileWidget.detail.closest(`#m_file_input_container`);

    const arrRemove = [...fileWidget.classList].filter(
        className => className.includes("-file-input")
    );
    fileWidget.classList.remove(...arrRemove);

    fileWidget.classList.add("audio-file-input");

    const {
        audioDuration,
        loadDuration,
        audioClassification,
        numberOfChannels,
        normalizedLevels,
        sampleRate,
    } = data;

    const canvas = document.createElement("canvas");
    const canvasContext = canvas.getContext("2d");

    const updatePlayerState = (e) => {
        const progress = audioDuration?
            audio.currentTime / audioDuration
            : 0;
        
        drawAudioPlayerView(canvas, canvasContext, progress, normalizedLevels, sampleRate);
        playerControlsElement.playerTimeElement.textContent = `${getUnitTime(audio.currentTime)} / ${getUnitTime(audioDuration)}`;
        
        if(!audio.paused){
            animationFrameId = requestAnimationFrame(updatePlayerState);
        };
    };
    
    const playerControlsElement = createPlayerControls(updatePlayerState, audio);
    const playerElement = setPlayerElement(
        audio,
        canvas,
        playerControlsElement.playerButtonElement,
        playerControlsElement.playerTimeElement,
    );

    let resizeAnimationFrameId;
    const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(resizeAnimationFrameId);

        const progress = audioDuration?
            audio.currentTime / audioDuration
            : 0;

        resizeAnimationFrameId = requestAnimationFrame(() => {
            drawAudioPlayerView(canvas, canvasContext, progress, normalizedLevels);
        });
    });

    resizeObserver.observe(canvas);

    canvas.addEventListener("player:update", updatePlayerState);

    standardFileWidget.preview.append(playerElement);

    drawAudioPlayerView(canvas, canvasContext, 0, normalizedLevels);

    const detailAudioDurationElement = document.createElement("span");
    const audioDurationBoldTextElement = document.createElement("b");
    const audioDurationSpanElement = document.createElement("span");

    audioDurationBoldTextElement.textContent = "Audio duration: ";
    detailAudioDurationElement.append(audioDurationBoldTextElement, audioDurationSpanElement);

    const detailLoadDurationElement = document.createElement("span");
    const loadDurationBoldTextElement = document.createElement("b");
    const loadDurationSpanElement = document.createElement("span");

    loadDurationBoldTextElement.textContent = "Load duration: ";
    detailLoadDurationElement.append(loadDurationBoldTextElement, loadDurationSpanElement);

    const detailAudioClassificationElement = document.createElement("span");
    const audioClassificationBoldTextElement = document.createElement("b");
    const audioClassificationSpanElement = document.createElement("span");

    audioClassificationBoldTextElement.textContent = "Audio Classification: ";
    detailAudioClassificationElement.append(audioClassificationBoldTextElement, audioClassificationSpanElement);

    const detailAudioNumberOfChannelsElement = document.createElement("span");
    const audioNumberOfChannelsBoldTextElement = document.createElement("b");
    const audioNumberOfChannelsSpanElement = document.createElement("span");

    audioNumberOfChannelsBoldTextElement.textContent = "Number of Channels: ";
    detailAudioNumberOfChannelsElement.append(audioNumberOfChannelsBoldTextElement, audioNumberOfChannelsSpanElement);

    detailAudioDurationElement.classList.add(`audio-duration`);
    detailAudioDurationElement.setAttribute("name", "audio-duration");

    detailLoadDurationElement.classList.add(`audio-load-duration`);
    detailLoadDurationElement.setAttribute("name", "audio-load-duration");

    detailAudioClassificationElement.classList.add("audio-classification");
    detailAudioClassificationElement.setAttribute("name", "audio-classification");

    detailAudioNumberOfChannelsElement.classList.add("audio-number-of-channels");
    detailAudioNumberOfChannelsElement.setAttribute("name", "audio-number-of-channels");

    audioDurationSpanElement.textContent = getUnitTime(audioDuration);
    
    loadDurationSpanElement.textContent = getUnitTinyTime(loadDuration);

    audioClassificationSpanElement.textContent = audioClassification;

    audioNumberOfChannelsSpanElement.textContent = numberOfChannels;

    standardFileWidget.detail.append(
        detailAudioDurationElement, detailAudioClassificationElement,
        detailAudioNumberOfChannelsElement, detailLoadDurationElement);
};

function setPlayerElement(audioElement, canvasAudioElement, playBtnElement, timeElement) {
    const container = document.createElement("div");

    container.setAttribute("name", "audio-player");
    container.classList.add("audio-player");

    audioElement.classList.add("hidden");

    const innerContainer = document.createElement("div");
    const canvasContainer = document.createElement("div");

    canvasContainer.appendChild(canvasAudioElement);

    innerContainer.append(playBtnElement, canvasContainer);

    container.append(audioElement, innerContainer, timeElement);

    return container;
}

function createPlayerControls(updatePlayerState, audio){
    const playerButtonElement = document.createElement("button");
    const playerTimeElement = document.createElement("p");

    playerButtonElement.setAttribute("name", "player-button");
    playerTimeElement.setAttribute("name", "player-time");

    const pauseIcon = document.getElementById("audio-player-pause-icon").content;
    const playIcon = document.getElementById("audio-player-play-icon").content;

    playerButtonElement.replaceChildren(playIcon.cloneNode(true));

    playerTimeElement.textContent = `${getUnitTime(audio.currentTime)} / ${getUnitTime(audio.duration)}`;

    playerButtonElement.addEventListener("click", async (e) => {
        if(audio.paused){
            await audio.play();
        }else{
            audio.pause();
        }
    });

    audio.addEventListener("play", () => {
        const pauseCloneIcon = pauseIcon.cloneNode(true);
        playerButtonElement.replaceChildren(pauseCloneIcon);
        updatePlayerState();
    });

    audio.addEventListener("pause", () => {
        const playCloneIcon = playIcon.cloneNode(true);
        playerButtonElement.replaceChildren(playCloneIcon);
        updatePlayerState();
    });

    audio.addEventListener("ended", () => {
        const playCloneIcon = playIcon.cloneNode(true);
        playerButtonElement.replaceChildren(playCloneIcon);
        updatePlayerState();
    });


    return {
        playerButtonElement, playerTimeElement
    };
};

const resizeCanvasToDisplaySize = canvas => {
    const pixelRatio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();

    const displayWidth = bounds.width;
    const displayHeight = bounds.height;

    const bufferWidth = Math.round(displayWidth * pixelRatio);
    const bufferHeight = Math.round(displayHeight * pixelRatio);

    const wasResized = canvas.width !== bufferWidth ||
        canvas.height !== bufferHeight;

    if(wasResized){
        canvas.width = bufferWidth;
        canvas.height = bufferHeight;
    };

    return {
        wasResized,
        displayWidth,
        displayHeight,
        pixelRatio,
    };
};

function drawAudioPlayerView(canvas, context, progress, levels) {
    if(!levels.length) return;

    const {
        displayWidth: width,
        displayHeight: height,
        pixelRatio,
    } = resizeCanvasToDisplaySize(canvas);

    if(width === 0 || height === 0) return;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const gap = 2;
    const barSlotWidth = width / levels.length;
    const barWidth = Math.max(1, barSlotWidth - gap);

    const drawBars = (color) => {
        context.beginPath();

        levels.forEach((level, index) => {
            const barHeight = Math.max(4, level * height * 0.85);

            const x = index * barSlotWidth;
            const y = (height - barHeight) / 2;

            context.roundRect(
                x,
                y,
                barWidth,
                barHeight,
                2
            );
        });

        context.fillStyle = color;
        context.fill();
    };

    drawBars("#777");

    const normalizedProgress = Math.max(
        0, Math.min(1, progress)
    );

    // console.log(progress, normalizedProgress);
    const playedWidth = width * normalizedProgress;

    context.save();

    context.beginPath();
    context.rect(0, 0, playedWidth, height);
    context.clip();

    drawBars("#FF5D5D");

    context.restore();
};

const loadHTMLImageFile = async (data) => {

    const standardFileWidget = loadStandardFileWidgetHtml(data);
    
    const fileWidget = standardFileWidget.detail.closest(`#m_file_input_container`);

    // const arrRemove = [...fileWidget.classList].filter(className => [
    //     "image-file-input-portrait",
    //     "image-file-input-square",
    //     "image-file-input-landscape",
    // ].includes(className));
    const arrRemove = [...fileWidget.classList].filter(
        className => className.includes("-file-input")
    );
    fileWidget.classList.remove(...(arrRemove));
    
    if(data.aspectRatio < 1){
        fileWidget.classList.add("image-file-input-portrait");
    } else if(data.aspectRatio === 1) {
        fileWidget.classList.add("image-file-input-square");
    } else if(data.aspectRatio > 1) {
        fileWidget.classList.add("image-file-input-landscape");
    } else {
        throw new Error("Undefined error in Image load html");
    }

    const {
        aspectRatio, 
        width,
        height,
        loadDuration,
        orientation,
        fileName,
        localUrl,
    } = data;
    
    const previewImageElement = document.createElement("img");
    
    previewImageElement.id = "file-preview-item";
    previewImageElement.classList.add("preview-image");
    previewImageElement.style.aspectRatio = aspectRatio;
    previewImageElement.style.width = width;
    previewImageElement.alt = `Image not loaded. File name = ${fileName}`;
    previewImageElement.src = localUrl;

    const detailLoadDurationElement = document.createElement("span");
    const loadDurationBoldTextElement = document.createElement("b");
    const loadDurationSpanElement = document.createElement("span");

    loadDurationBoldTextElement.textContent = "Load Duration File: ";
    detailLoadDurationElement.append(loadDurationBoldTextElement, loadDurationSpanElement);

    const detailOrientationElement = document.createElement("span");
    const orientationBoldTextElement = document.createElement("b");
    const orientationSpanElement = document.createElement("span");

    orientationBoldTextElement.textContent = "Orientation: ";
    detailOrientationElement.append(orientationBoldTextElement, orientationSpanElement);

    const detailDimensionElement = document.createElement("span");
    const dimensionBoldTextElement = document.createElement("b");
    const dimensionSpanElement = document.createElement("span");

    dimensionBoldTextElement.textContent = "Dimensions: ";
    detailDimensionElement.append(dimensionBoldTextElement, dimensionSpanElement);

    detailLoadDurationElement.classList.add("image-load-duration");
    detailLoadDurationElement.setAttribute("name", "image-load-duration");
    
    detailOrientationElement.classList.add(`image-orientation`);
    detailOrientationElement.setAttribute("name", "image-orientation");
    
    detailDimensionElement.classList.add("image-dimension");
    detailDimensionElement.setAttribute("name", "image-dimension");

    loadDurationSpanElement.textContent = getUnitTinyTime(loadDuration);

    orientationSpanElement.textContent = String(orientation).concat(
        " \u00b7 ", getAspectRatioTag(aspectRatio).toUpperCase());

    dimensionSpanElement.textContent = String(width).concat(" \u00b7 ", String(height));

    standardFileWidget.preview.append(
        previewImageElement);

    standardFileWidget.detail.append(
        detailDimensionElement, detailOrientationElement, detailLoadDurationElement);
};

const loadHTMLVideoFile = async (data, videoElement) => {
    const standardFileWidget = loadStandardFileWidgetHtml(data);

    const fileWidget = standardFileWidget.detail.closest(`#m_file_input_container`);

    // const arrRemove = [...fileWidget.classList].filter(className => [
    //     "video-file-input-portrait",
    //     "video-file-input-landscape",
    //     "video-file-input-square"
    // ].includes(className));
    const arrRemove = [...fileWidget.classList].filter(
        className => className.includes("-file-input")
    );
    fileWidget.classList.remove(...arrRemove);

    const {
        aspectRatio,
        width,
        height,
        videoDuration,
        loadDuration,
        orientation,
        localUrl,
    } = data;

    if(aspectRatio < 1){
        fileWidget.classList.add("video-file-input-portrait");
        // videoElement.style.height = height;
        const container = fileWidget.querySelector(`#id_landscape-label-upload`);
        if(container)
            container.remove();

    } else if(aspectRatio === 1){
        fileWidget.classList.add("video-file-input-square");
        // videoElement.style.width = width;

        const container = fileWidget.querySelector(`#id_landscape-label-upload`);
        if(container)
            container.remove();

    } else if(aspectRatio > 1){
        fileWidget.classList.add("video-file-input-landscape");

        const archiveLabelUploadElement = getExactlyOne(fileWidget, `label:has(#id_archive)`);
        const innerContainerLabelUploadElement = getExactlyOne(archiveLabelUploadElement, `div:has(svg)`);

        const container = document.createElement("div");
        const pElement = document.createElement("p");
        
        pElement.textContent = "Select an archive";
        container.id = "id_landscape-label-upload";

        container.appendChild(pElement);
        innerContainerLabelUploadElement.appendChild(container);
    } else{
        throw new Error('Undefined error in video load html');
    }

    videoElement.id = "file-preview-item";
    videoElement.classList.add("preview-video");
    videoElement.style.aspectRatio = aspectRatio;

    const detailVideoDurationElement = document.createElement("span");
    const videoDurationBoldText = document.createElement("b");
    const videoDurationSpanElement = document.createElement("span");
    
    videoDurationBoldText.textContent = "Video Duration: ";
    detailVideoDurationElement.append(videoDurationBoldText, videoDurationSpanElement);

    const detailDimensionElement = document.createElement("span");
    const dimensionBoldText = document.createElement("b");
    const dimensionSpanElement = document.createElement("span");

    dimensionBoldText.textContent = "Dimension: ";
    detailDimensionElement.append(dimensionBoldText, dimensionSpanElement);

    const detailOrientationElement = document.createElement("span");
    const orientationBoldText = document.createElement("b");
    const orientationSpanElement = document.createElement("span");

    orientationBoldText.textContent = "Orientation: ";
    detailOrientationElement.append(orientationBoldText, orientationSpanElement);

    const detailLoadDurationElement = document.createElement("span");
    const loadDurationBoldTextElement = document.createElement("b");
    const loadDurationSpanElement = document.createElement("span");

    loadDurationBoldTextElement.textContent = "Load Duration: ";
    detailLoadDurationElement.append(loadDurationBoldTextElement, loadDurationSpanElement);
    
    detailVideoDurationElement.classList.add("video-duration");
    detailVideoDurationElement.setAttribute("name", "video-duration");

    detailDimensionElement.classList.add("video-dimension");
    detailDimensionElement.setAttribute("name", "video-dimension");

    detailOrientationElement.classList.add("video-orientation");
    detailOrientationElement.setAttribute("name", "video-orientation");

    detailLoadDurationElement.classList.add("video-load-duration");
    detailLoadDurationElement.setAttribute("name", "video-load-duration");

    videoDurationSpanElement.textContent = getUnitTime(videoDuration);
    
    dimensionSpanElement.textContent = String(width).concat(" \u00b7 ", String(height));
    
    orientationSpanElement.textContent = String(orientation).concat(" \u00b7 ", String(getAspectRatioTag(aspectRatio).toUpperCase()));
    
    loadDurationSpanElement.textContent = String(getUnitTinyTime(loadDuration));

    standardFileWidget.preview.append(videoElement);

    standardFileWidget.detail.append(
        detailVideoDurationElement, detailDimensionElement, detailOrientationElement,
        detailLoadDurationElement);
};

const loadiFilePdfHandler = (localUrlPdf, loadingManager) => {
    const pdfFrame = document.createElement("frame");
    pdfFrame.src = localUrlPdf;

    loadingManager.dispatchChangeStateEvent("Loading pdf file...");
    
    pdfFrame.addEventListener("load", () => {
        console.log("MEU deus");
    });
};

const loadFileImageHandler = (localUrlImage, loadingManager) => new Promise((resolve, reject) => {
    const image = new Image();
    image.src = localUrlImage;
    const initialTimeStamp = performance.now();

    loadingManager.dispatchChangeStateEvent("Loading image file...");

    image.addEventListener("load", ()=>{
        const width = image.naturalWidth;
        const height = image.naturalHeight;

        const loadDuration = performance.now() - initialTimeStamp;
        
        resolve({
            width,
            height,
            aspectRatio: width / height,
            loadDuration,
            orientation:
                width > height
                ? "landscape" :
                width < height
                ? "portrait" :
                "square",
                
        });
    }, {once:true});

    image.addEventListener("error", ()=>{
        const loadDuration = performance.now() - initialTimeStamp;

        reject({
            code: "IMAGE_LOAD_ERROR",
            message:"Fail to load the image in local URL",
            url:localUrlImage,
            loadDuration,
        });
    }, {once:true});

});

const loadFileVideoHandler = (localUrlVideo, video, loadingManager) => new Promise((resolve, reject) => {
    video.controls = true;
    video.src = localUrlVideo;
    video.preload = "metadata";

    loadingManager.dispatchChangeStateEvent("Loading video file...");
    const initialTimeStamp = performance.now();

    video.addEventListener("loadedmetadata", () => {
        const width = video.videoWidth;
        const height = video.videoHeight;

        const loadDuration = performance.now() - initialTimeStamp;
        video.currentTime = Math.floor(video.duration/2);

        resolve({
            width,
            height,
            aspectRatio: width / height,
            localUrl: video.currentSrc || video.src,
            videoDuration: video.duration,
            loadDuration,
            orientation: width > height
                ? "landscape" : width < height
                ? "portrait" : "square",
        })
    }, {once:true});
    
    video.addEventListener("seeked", () => {
        loadingManager.dispatchChangeStateEvent("Loading video poster...");

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        video.poster = canvas.toDataURL("image/jpeg", 0.85);

        video.load();
    }, {once:true});

    video.addEventListener("error", () => {
        const loadDuration = performance.now() - initialTimeStamp;

        reject({
            code: "VIDEO_LOAD_ERROR",
            message: "Fail to load the video",
            url:localUrlVideo,
            loadDuration,
        });

    }, {once:true});

});

const loadFileAudioHandler = (audioFileBody, audio, loadingManager) => new Promise((resolve, reject) => {
    const {
        file: audioFile,
        localUrlFile: localUrlAudio,
    } = audioFileBody;

    const loadAudioMetadata = () => new Promise((resolve, reject) => {
        audio.preload = "metadata";
        audio.src = localUrlAudio;

        const initialTimeStamp = performance.now();

        loadingManager.dispatchChangeStateEvent("Loading Audio File...");

        audio.addEventListener("loadedmetadata", ()=>{
            const loadDuration = performance.now() - initialTimeStamp;

            resolve({
                audioDuration: audio.duration,
                loadDuration,
            });

        }, {once:true});

        audio.addEventListener("error", ()=>{
            const loadDuration = performance.now() - initialTimeStamp;

            reject({
                code: "AUDIO_LOAD_ERROR",
                message: "Fail to load the audio",
                url: localUrlAudio,
                loadDuration
            });
        }, {once:true});
    });

    const readAudioFile = async (audioFile, nUnit = 100) => {
        const audioData = {};

        const t0 = performance.now();

        const arrBuffer = await audioFile.arrayBuffer();

        const tArrBuffer = performance.now();

        loadingManager.dispatchChangeStateEvent("Decoding Audio File...");
        
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrBuffer);

        const tAudioDecode = performance.now();

        audioData.numberOfChannels = audioBuffer.numberOfChannels;
        audioData.sampleRate = audioBuffer.sampleRate;
        audioData.audioDuration = audioBuffer.duration;
        
        if(audioData.numberOfChannels === 1) {
            audioData.audioClassification = "mono";

        } else if(audioData.numberOfChannels > 2) {
            audioData.audioClassification = "multi-channel";

        } else {
            audio.audioClassification = "implement stereo analise";
        };

        const channelData = audioBuffer.getChannelData(0);

        // TAKE A ONE PART SAMPLE, INSTEAD THE SAMPLE
        
        const samplePerUnit = Math.floor(channelData.length / nUnit); //LOSE INFO ?

        const maxSampleUnit = 2000;
        const sampleStepUnit = Math.max( Math.floor(samplePerUnit / maxSampleUnit), 1);

        // console.log(sampleStepUnit);
        const tBeforeLevelConstruct = performance.now();

        loadingManager.dispatchChangeStateEvent("Extracting Audio Levels...");

        const arrLevels = [];

        let maxRms = null;
        for(let iUnit = 0; iUnit < nUnit; iUnit++) {

            const initData = iUnit * samplePerUnit;
            const endData = (iUnit + 1) * samplePerUnit;

            let sSampleValue = 0;

            let iSampleData = initData;
            while(iSampleData < endData){
                sSampleValue += channelData[iSampleData] ** 2
                iSampleData += sampleStepUnit;
            };

            const rms = Math.sqrt(sSampleValue);

            if(!maxRms || maxRms < rms)
                maxRms = rms;

            arrLevels.push(rms);
        }

        const tAfterLevelConstruct = performance.now();

        await audioContext.close();

        const normalizedLevels = arrLevels.map(level => maxRms === 0? 0 : level/maxRms);
        audioData.normalizedLevels = normalizedLevels;

        const tNormalizedLevels = performance.now();

        console.table({
            fileArrayBuffer: {
                miliseconds:
                    getUnitTinyTime(tArrBuffer - t0),
            },
            decodeAudioData: {
                miliseconds: getUnitTinyTime(tAudioDecode - tArrBuffer)
            },
            extractLevels: {
                miliseconds: getUnitTinyTime(tAfterLevelConstruct - tBeforeLevelConstruct)
            },
            normalizedLevels: {
                miliseconds: getUnitTinyTime(tNormalizedLevels - tAfterLevelConstruct)
            },
            total: {
                miliseconds: getUnitTinyTime(tNormalizedLevels - t0),
            }
        });

        console.table({
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            numberOfChannels: audioBuffer.numberOfChannels,
            samplesPerChannel: audioBuffer.length,
            samplePerUnit,
            sampleStepUnit,
            analyzedSamplesPerUnit: Math.floor(samplePerUnit / sampleStepUnit)
        });

        return audioData;
    };

    Promise.all([loadAudioMetadata(), readAudioFile(audioFile, 100)])
        .then(audioData => {
            const {audioDuration: durationOne} = audioData[0];
            const {audioDuration: durationTwo} = audioData[0];
            const meanDuration = (durationOne + durationTwo)/2;

            resolve({
                ...audioData[0],
                ...audioData[1],
                audioDuration: meanDuration,
            })

        }).catch(err => {
            console.log(err);
            reject(err);
        });

});

const updateFileInputContainer = (e) => {
    const file = e.target.files[0];
    
    const fileName = file.name;
    const fileNameArchiveInput = document.querySelector(`label:has(> input[name="archive"]) > div:not(:has(> svg)) > p`);
    fileNameArchiveInput.textContent = fileName;

    const smallTextArchiveInput = document.querySelector(`label:has(> input[name="archive"]) > div:not(:has(> svg)) > small`);
    smallTextArchiveInput.textContent = "Status: Active";
}

const changeIdArchiveHandler = (e) => {
    const actualFile = e.target.files[0];
    const inputFile = e.target;
    
    inputFile.dataset.fileMimeType = actualFile.type;
    const objFileConfig = fileConfig(actualFile, false);

    const containerPreview = insertPreviewHTMLElement(objFileConfig);
    updateMimeTypeFileInput(actualFile.type);
}

function fileConfig(inputFile, isInputFile) {
    
    if(isInputFile) {
        const isInitialFile = String(inputFile.dataset.fieldInitial).toLocaleLowerCase() === "true";

        if(isInitialFile) {
            const mimeType = inputFile.dataset.fileMimeType;
            const fileURL = inputFile.dataset.fileUrl;
            return {mimeType, fileURL};
        }

        return {
            mimeType: null, fileURL: null
        };
    }

    const mimeType = inputFile.type || null;
    const fileURL = URL.createObjectURL(inputFile) || null; // Não esquecer de dar revoke nisso
    const fileName = inputFile.name || null;

    return {mimeType, fileURL, fileName};
}

function insertPreviewHTMLElement(objFileConfig) {
    const { mimeType, fileURL } = objFileConfig;

    const containerPreview = document.getElementById("id_preview-file-container");
    for(let i=0; i<containerPreview.children.length; i++) {
        containerPreview.children[i].remove();
    }
    
    let htmlElement = null;
    
    if(mimeType === null) return containerPreview;

    if(String(mimeType).startsWith("image/")) {
        htmlElement = document.createElement("img");
        htmlElement.alt = `Image not loaded. File Name = ${objFileConfig.fileName || "None"}`
        htmlElement.classList.add("preview-image");

    }else if(String(mimeType).startsWith("audio/")) {
        htmlElement = document.createElement("audio");
        htmlElement.controls = true;
        htmlElement.preload = "metadata";
        htmlElement.textContent = `Audio ${objFileConfig.fileName || "None"} not supported`;
        htmlElement.classList.add("preview-audio");

    }else if(String(mimeType).includes("pdf")) {
        htmlElement = document.createElement("iframe");
        htmlElement.title = `Preview of ${objFileConfig.fileName || "None"}`;
        htmlElement.width = 700;
        htmlElement.height = 350;
        htmlElement.classList.add("preview-pdf");

    }else if(String(mimeType).startsWith("video/")) {
        htmlElement = document.createElement("video");
        htmlElement.controls = true;
        htmlElement.preload = "metadata";
        htmlElement.width = 400;
        htmlElement.height = 400;

    }else{
        htmlElement = document.createElement("p");
        htmlElement.textContent = `Archive Name: ${objFileConfig.fileName || "None"}`;
        htmlElement.classList.add("preview-others");

    }

    htmlElement.src = fileURL;
    htmlElement.id = "file-preview-item";

    containerPreview.appendChild(htmlElement);
    return containerPreview;
}

initializeFileWidget();
