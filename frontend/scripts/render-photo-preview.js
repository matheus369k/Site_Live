const createPhotoPreviews = () => {
  // Preview de fotos
  document.getElementById("photos").addEventListener("change", function (e) {
    const preview = document.getElementById("photoPreview");
    preview.innerHTML = "";
    const files = Array.from(e.target.files).slice(0, 5);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const div = document.createElement("div");
        div.style.aspectRatio = "3/4";
        div.style.borderRadius = "8px";
        div.style.overflow = "hidden";

        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";

        div.appendChild(img);
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });
};

module.exports = { createPhotoPreviews };
