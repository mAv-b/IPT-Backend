const inputImage = document.getElementById("id_input-image");
const previewImage = document.getElementById("id_image-author");

let previewUrl = null;

inputImage.addEventListener("change", function () {
    const file = this.files[0];


    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("error zeca");
        this.value = "";
        return;
    };

    if (!previewUrl) {
        URL.revokeObjectURL(previewUrl);
    };

    previewUrl = URL.createObjectURL(file);
    previewImage.src = previewUrl;
});