const { PDFDocument } = PDFLib;

let selectedFiles = [];
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const fileCount = document.getElementById("fileCount");
const fileList = document.getElementById("fileList");
const mergeBtn = document.getElementById("mergeBtn");
const clearBtn = document.getElementById("clearBtn");
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const message = document.getElementById("message");
const converterDialog = document.getElementById("converterDialog");
const openConverterBtn = document.getElementById("openConverterBtn");
const closeConverterBtn = document.getElementById("closeConverterBtn");
const cancelConverterBtn = document.getElementById("cancelConverterBtn");
const imageInput = document.getElementById("imageInput");
const selectedImages = document.getElementById("selectedImages");
const converterMessage = document.getElementById("converterMessage");
const convertBtn = document.getElementById("convertBtn");
let selectedImagesFiles = [];
let isConvertingImages = false;

// Click para abrir seletor de arquivos
uploadArea.addEventListener("click", () => fileInput.click());

// Prevenir comportamento padrão de drag
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  uploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Highlight ao arrastar
["dragenter", "dragover"].forEach((eventName) => {
  uploadArea.addEventListener(eventName, () => {
    uploadArea.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  uploadArea.addEventListener(eventName, () => {
    uploadArea.classList.remove("dragover");
  });
});

// Drop de arquivos
uploadArea.addEventListener("drop", (e) => {
  const files = Array.from(e.dataTransfer.files).filter(
    (file) => file.type === "application/pdf",
  );
  addFiles(files);
});

// Seleção de arquivos
fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  addFiles(files);
  fileInput.value = ""; // Limpar input
});

function addFiles(files) {
  selectedFiles = [...selectedFiles, ...files];
  updateFileList();
  updateMergeButton();
}

function updateFileList() {
  fileList.innerHTML = "";

  fileCount.textContent =
    "Quantidade de arquivos: " +
    selectedFiles.length +
    (selectedFiles.length > 1 ? " • Arraste para reordenar" : "");

  selectedFiles.forEach((file, index) => {
    const fileItem = document.createElement("div");
    fileItem.className = "file-item";
    fileItem.draggable = true;
    fileItem.dataset.index = index;

    const fileName = document.createElement("span");
    fileName.className = "file-name";
    fileName.textContent = file.name;

    const fileSize = document.createElement("span");
    fileSize.className = "file-size";
    fileSize.textContent = formatFileSize(file.size);

    const orderControls = document.createElement("div");
    orderControls.className = "file-order-controls";

    const moveUpBtn = document.createElement("button");
    moveUpBtn.className = "move-file-btn";
    moveUpBtn.type = "button";
    moveUpBtn.textContent = "↑";
    moveUpBtn.title = `Mover ${file.name} para cima`;
    moveUpBtn.setAttribute("aria-label", moveUpBtn.title);
    moveUpBtn.disabled = index === 0;
    moveUpBtn.onclick = () => moveFile(index, -1);

    const moveDownBtn = document.createElement("button");
    moveDownBtn.className = "move-file-btn";
    moveDownBtn.type = "button";
    moveDownBtn.textContent = "↓";
    moveDownBtn.title = `Mover ${file.name} para baixo`;
    moveDownBtn.setAttribute("aria-label", moveDownBtn.title);
    moveDownBtn.disabled = index === selectedFiles.length - 1;
    moveDownBtn.onclick = () => moveFile(index, 1);

    orderControls.appendChild(moveUpBtn);
    orderControls.appendChild(moveDownBtn);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.type = "button";
    removeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
</svg>`;
    removeBtn.onclick = () => removeFile(index);

    fileItem.appendChild(fileName);
    fileItem.appendChild(fileSize);
    fileItem.appendChild(orderControls);
    fileItem.appendChild(removeBtn);
    fileList.appendChild(fileItem);
  });

  clearBtn.style.display = selectedFiles.length > 0 ? "block" : "none";
}

function moveFile(index, offset) {
  const destination = index + offset;
  if (destination < 0 || destination >= selectedFiles.length) return;

  [selectedFiles[index], selectedFiles[destination]] = [
    selectedFiles[destination],
    selectedFiles[index],
  ];
  updateFileList();
}

let draggedFileIndex = null;

fileList.addEventListener("dragstart", (event) => {
  const fileItem = event.target.closest(".file-item");
  if (!fileItem) return;

  draggedFileIndex = Number(fileItem.dataset.index);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(draggedFileIndex));
  fileItem.classList.add("dragging");
});

fileList.addEventListener("dragover", (event) => {
  const targetItem = event.target.closest(".file-item");
  if (!targetItem || draggedFileIndex === null) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  fileList
    .querySelectorAll(".drag-before, .drag-after")
    .forEach((item) => item.classList.remove("drag-before", "drag-after"));

  const after =
    event.clientY >
    targetItem.getBoundingClientRect().top + targetItem.offsetHeight / 2;
  targetItem.classList.add(after ? "drag-after" : "drag-before");
});

fileList.addEventListener("drop", (event) => {
  const targetItem = event.target.closest(".file-item");
  if (!targetItem || draggedFileIndex === null) return;

  event.preventDefault();
  const targetIndex = Number(targetItem.dataset.index);
  const after =
    event.clientY >
    targetItem.getBoundingClientRect().top + targetItem.offsetHeight / 2;
  let destination = targetIndex + (after ? 1 : 0);
  if (destination > draggedFileIndex) destination--;

  if (destination !== draggedFileIndex) {
    const [file] = selectedFiles.splice(draggedFileIndex, 1);
    selectedFiles.splice(destination, 0, file);
    updateFileList();
  }
});

fileList.addEventListener("dragend", () => {
  draggedFileIndex = null;
  fileList
    .querySelectorAll(".dragging, .drag-before, .drag-after")
    .forEach((item) => item.classList.remove("dragging", "drag-before", "drag-after"));
});

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFileList();
  updateMergeButton();
}

function updateMergeButton() {
  mergeBtn.disabled = selectedFiles.length < 2;
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

clearBtn.addEventListener("click", () => {
  selectedFiles = [];
  updateFileList();
  updateMergeButton();
  hideMessage();
});

mergeBtn.addEventListener("click", async () => {
  if (selectedFiles.length < 2) {
    showMessage("Selecione pelo menos 2 arquivos PDF", "error");
    return;
  }

  try {
    mergeBtn.disabled = true;
    clearBtn.disabled = true;
    progressContainer.style.display = "block";
    hideMessage();

    // Criar novo documento PDF
    const mergedPdf = await PDFDocument.create();

    // Processar cada arquivo
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const progress = Math.round(((i + 1) / selectedFiles.length) * 100);
      updateProgress(progress);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    // Salvar PDF mesclado
    const mergedPdfFile = await mergedPdf.save();
    const blob = new Blob([mergedPdfFile], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    // Download automático
    const link = document.createElement("a");
    link.href = url;
    link.download = "merged_document.pdf";
    link.click();

    URL.revokeObjectURL(url);

    showMessage("Documentos mesclados!", "success");
  } catch (error) {
    console.error("Erro ao mesclar PDFs:", error);
    showMessage("Erro ao mesclar documentos: " + error.message, "error");
  } finally {
    mergeBtn.disabled = false;
    clearBtn.disabled = false;
    progressContainer.style.display = "none";
    updateProgress(0);
  }
});

function updateProgress(percent) {
  progressFill.style.width = percent + "%";
  progressFill.textContent = percent + "%";
}

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message " + type;
  message.style.display = "block";
}

function hideMessage() {
  message.style.display = "none";
}

openConverterBtn.addEventListener("click", () => {
  selectedImagesFiles = [];
  imageInput.value = "";
  updateSelectedImages();
  hideConverterMessage();
  converterDialog.showModal();
});

closeConverterBtn.addEventListener("click", closeConverterDialog);
cancelConverterBtn.addEventListener("click", closeConverterDialog);

converterDialog.addEventListener("cancel", (event) => {
  if (isConvertingImages) event.preventDefault();
});

imageInput.addEventListener("change", () => {
  selectedImagesFiles = Array.from(imageInput.files).filter((file) =>
    file.type.startsWith("image/"),
  );
  updateSelectedImages();
  hideConverterMessage();
});

convertBtn.addEventListener("click", async () => {
  if (selectedImagesFiles.length === 0 || isConvertingImages) return;

  setImageConversionState(true);
  hideConverterMessage();
  let conversionSucceeded = false;

  try {
    const pdf = await PDFDocument.create();

    for (const file of selectedImagesFiles) {
      const { image, width, height } = await embedImage(pdf, file);
      const page = pdf.addPage([width, height]);
      page.drawImage(image, { x: 0, y: 0, width, height });
    }

    const pdfBytes = await pdf.save();
    downloadPdf(pdfBytes, "imagens.pdf");
    conversionSucceeded = true;
  } catch (error) {
    console.error("Erro ao converter imagens para PDF:", error);
    showConverterMessage(
      "Não foi possível converter as imagens. Verifique os arquivos e tente novamente.",
    );
  } finally {
    setImageConversionState(false);
    if (conversionSucceeded) closeConverterDialog();
  }
});

function updateSelectedImages() {
  const count = selectedImagesFiles.length;
  selectedImages.textContent =
    count === 0
      ? "Nenhuma imagem selecionada"
      : `${count} ${count === 1 ? "imagem selecionada" : "imagens selecionadas"}: ${selectedImagesFiles
          .map((file) => file.name)
          .join(", ")}`;
  convertBtn.disabled = count === 0 || isConvertingImages;
}

function setImageConversionState(isConverting) {
  isConvertingImages = isConverting;
  convertBtn.disabled = isConverting || selectedImagesFiles.length === 0;
  convertBtn.textContent = isConverting ? "Convertendo..." : "Converter para PDF";
  imageInput.disabled = isConverting;
  closeConverterBtn.disabled = isConverting;
  cancelConverterBtn.disabled = isConverting;
  if (isConverting) {
    converterMessage.textContent = "Processando imagens...";
    converterMessage.classList.add("visible", "processing");
  } else if (converterMessage.classList.contains("processing")) {
    hideConverterMessage();
  }
}

function closeConverterDialog() {
  if (isConvertingImages) return;
  converterDialog.close();
}

function showConverterMessage(text) {
  converterMessage.textContent = text;
  converterMessage.classList.add("visible");
  converterMessage.classList.remove("processing");
}

function hideConverterMessage() {
  converterMessage.textContent = "";
  converterMessage.classList.remove("visible", "processing");
}

async function embedImage(pdf, file) {
  const bytes = await file.arrayBuffer();

  if (file.type === "image/png") {
    const image = await pdf.embedPng(bytes);
    return { image, width: image.width, height: image.height };
  }

  if (file.type === "image/jpeg") {
    const image = await pdf.embedJpg(bytes);
    return { image, width: image.width, height: image.height };
  }

  const imageElement = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem.");
  context.drawImage(imageElement, 0, 0);

  const pngBlob = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Não foi possível processar a imagem."));
    }, "image/png");
  });
  const image = await pdf.embedPng(await pngBlob.arrayBuffer());
  return { image, width: image.width, height: image.height };
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Não foi possível abrir a imagem ${file.name}.`));
    };
    image.src = objectUrl;
  });
}

function downloadPdf(pdfBytes, fileName) {
  const url = URL.createObjectURL(new Blob([pdfBytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
