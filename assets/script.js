const { PDFDocument, degrees } = PDFLib;

let selectedFiles = [];
const filePageRotations = new WeakMap();
const filePageCountPromises = new WeakMap();
const fileThumbnailPromises = new WeakMap();
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const fileCount = document.getElementById("fileCount");
const fileList = document.getElementById("fileList");
const documentActions = document.getElementById("documentActions");
const mergeBtn = document.getElementById("mergeBtn");
const clearBtn = document.getElementById("clearBtn");
const selectFilesBtn = document.getElementById("selectFilesBtn");
const progressContainer = document.getElementById("progressContainer");
const progressFill = document.getElementById("progressFill");
const message = document.getElementById("message");
const toolTabs = Array.from(document.querySelectorAll(".tool-tab"));
const toolViews = {
  merge: document.getElementById("mergeView"),
  splitter: document.getElementById("splitterView"),
  converter: document.getElementById("converterView"),
};
let activeTool = "merge";
const pageRotationDialog = document.getElementById("pageRotationDialog");
const pageRotationTitle = document.getElementById("pageRotationTitle");
const pageRotationSummary = document.getElementById("pageRotationSummary");
const pageRotationMessage = document.getElementById("pageRotationMessage");
const pageRotationPreview = document.getElementById("pageRotationPreview");
const closePageRotationBtn = document.getElementById("closePageRotationBtn");
const donePageRotationBtn = document.getElementById("donePageRotationBtn");
let activePageRotationPdf = null;
let pageRotationRequest = 0;
const imageInput = document.getElementById("imageInput");
const selectedImages = document.getElementById("selectedImages");
const imagePreview = document.getElementById("imagePreview");
const converterMessage = document.getElementById("converterMessage");
const convertBtn = document.getElementById("convertBtn");
let selectedImagesFiles = [];
const imageRotations = new WeakMap();
let isConvertingImages = false;
const splitPdfInput = document.getElementById("splitPdfInput");
const selectedSplitPdf = document.getElementById("selectedSplitPdf");
const pageRangeInput = document.getElementById("pageRangeInput");
const splitterMessage = document.getElementById("splitterMessage");
const splitBtn = document.getElementById("splitBtn");
const splitPreview = document.getElementById("splitPreview");
let selectedSplitFile = null;
let splitPdfPageCount = 0;
let splitPreviewRequest = 0;
let isSplittingPdf = false;
let selectedPageNumbers = new Set();
const splitPageRotations = new Map();

toolTabs.forEach((tab) => {
  tab.addEventListener("click", () => selectTool(tab.dataset.tool));
});

// Click para abrir seletor de arquivos
uploadArea.addEventListener("click", () => fileInput.click());
selectFilesBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  fileInput.click();
});

function selectTool(tool) {
  if (!toolViews[tool] || isConvertingImages || isSplittingPdf) return;

  const toolChanged = activeTool !== tool;
  if (activeTool === "splitter" && tool !== "splitter") {
    splitPreviewRequest++;
  }
  activeTool = tool;

  toolTabs.forEach((tab) => {
    const isActive = tab.dataset.tool === tool;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
  Object.entries(toolViews).forEach(([name, view]) => {
    view.hidden = name !== tool;
  });

  if (!toolChanged) return;

  if (tool === "converter") {
    selectedImagesFiles = [];
    imageInput.value = "";
    updateSelectedImages();
    hideConverterMessage();
  }

  if (tool === "splitter") {
    selectedSplitFile = null;
    splitPdfPageCount = 0;
    selectedPageNumbers.clear();
    splitPageRotations.clear();
    splitPreviewRequest++;
    splitPreview.innerHTML = "";
    splitPdfInput.value = "";
    pageRangeInput.value = "";
    updateSelectedSplitPdf();
    hideSplitterMessage();
  }
}

function setToolTabsDisabled(disabled) {
  toolTabs.forEach((tab) => {
    tab.disabled = disabled;
  });
}

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
  addFiles(Array.from(e.dataTransfer.files));
});

// Seleção de arquivos
fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  addFiles(files);
  fileInput.value = ""; // Limpar input
});

function addFiles(files) {
  const pdfFiles = files.filter(isPdfFile);
  const rejectedFiles = files.filter((file) => !isPdfFile(file));

  if (rejectedFiles.length > 0) {
    showMessage(
      `Selecione apenas arquivos PDF. Arquivos ignorados: ${rejectedFiles
        .map((file) => file.name)
        .join(", ")}`,
      "error",
    );
  }

  selectedFiles = [...selectedFiles, ...pdfFiles];
  updateFileList();
  updateMergeButton();
}

function isPdfFile(file) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
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

    const thumbnail = document.createElement("div");
    thumbnail.className = "file-thumbnail";
    thumbnail.textContent = "PDF";

    const fileDetails = document.createElement("div");
    fileDetails.className = "file-details";

    const fileName = document.createElement("span");
    fileName.className = "file-name";
    fileName.textContent = file.name;

    const fileSize = document.createElement("span");
    fileSize.className = "file-size";
    fileSize.textContent = formatFileSize(file.size);

    const pageCount = document.createElement("span");
    pageCount.className = "file-page-count";
    pageCount.textContent = "Lendo páginas...";

    const fileHint = document.createElement("span");
    fileHint.className = "file-hint";
    fileHint.textContent = "Ver páginas";

    fileDetails.appendChild(fileName);
    fileDetails.appendChild(fileSize);
    fileDetails.appendChild(pageCount);
    fileDetails.appendChild(fileHint);

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

    fileItem.appendChild(thumbnail);
    fileItem.appendChild(fileDetails);
    const fileActions = document.createElement("div");
    fileActions.className = "file-actions";
    fileActions.appendChild(orderControls);
    fileActions.appendChild(removeBtn);
    fileItem.appendChild(fileActions);

    const openPreviewBtn = document.createElement("button");
    openPreviewBtn.className = "file-open-btn";
    openPreviewBtn.type = "button";
    openPreviewBtn.setAttribute(
      "aria-label",
      `Visualizar e girar páginas de ${file.name}`,
    );
    openPreviewBtn.title = "Visualizar páginas e ajustar rotação";
    openPreviewBtn.addEventListener("click", () =>
      openPageRotationDialog(file),
    );
    fileItem.appendChild(openPreviewBtn);

    fileList.appendChild(fileItem);

    renderFilePageCount(file, pageCount);
    renderMergeThumbnail(file, thumbnail);
  });

  documentActions.hidden = selectedFiles.length === 0;
}

async function renderFilePageCount(file, container) {
  try {
    const pageCount = await getFilePageCount(file);
    if (container.isConnected) {
      container.textContent = `${pageCount} ${
        pageCount === 1 ? "página" : "páginas"
      }`;
    }
  } catch (error) {
    console.error(`Erro ao contar páginas de "${file.name}":`, error);
    if (container.isConnected) container.textContent = "Páginas indisponíveis";
  }
}

async function renderMergeThumbnail(file, container) {
  try {
    const rotation = getPageRotation(file, 0);
    const thumbnailUrl = await getFileThumbnail(file, rotation);
    if (!container.isConnected || getPageRotation(file, 0) !== rotation) return;
    container.textContent = "";
    const image = document.createElement("img");
    image.src = thumbnailUrl;
    image.alt = `Miniatura da primeira página de ${file.name}`;
    container.appendChild(image);
  } catch (error) {
    console.error(`Erro ao gerar miniatura de "${file.name}":`, error);
    if (container.isConnected) container.textContent = "Prévia indisponível";
  }
}

async function loadPdfJsDocument(file) {
  if (typeof pdfjsLib === "undefined") {
    throw new Error("O visualizador de páginas não foi carregado.");
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  return pdfjsLib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;
}

async function getFilePageCount(file) {
  let pageCountPromise = filePageCountPromises.get(file);
  if (!pageCountPromise) {
    pageCountPromise = (async () => {
      const pdf = await loadPdfJsDocument(file);
      try {
        return pdf.numPages;
      } finally {
        await pdf.destroy();
      }
    })();
    filePageCountPromises.set(file, pageCountPromise);
  }
  return pageCountPromise;
}

async function getFileThumbnail(file, rotation) {
  let thumbnails = fileThumbnailPromises.get(file);
  if (!thumbnails) {
    thumbnails = new Map();
    fileThumbnailPromises.set(file, thumbnails);
  }

  const normalizedRotation = (rotation + 360) % 360;
  let thumbnailPromise = thumbnails.get(normalizedRotation);
  if (!thumbnailPromise) {
    thumbnailPromise = (async () => {
      const pdf = await loadPdfJsDocument(file);
      try {
        const page = await pdf.getPage(1);
        const canvas = await renderPdfPage(page, normalizedRotation, 100);
        return canvas.toDataURL("image/png");
      } finally {
        await pdf.destroy();
      }
    })();
    thumbnails.set(normalizedRotation, thumbnailPromise);
  }
  return thumbnailPromise;
}

async function renderPdfPage(page, additionalRotation = 0, maxDimension = 180) {
  const rotation = (page.rotate + additionalRotation + 360) % 360;
  const naturalViewport = page.getViewport({ scale: 1, rotation });
  const scale = Math.min(
    0.45,
    maxDimension / Math.max(naturalViewport.width, naturalViewport.height),
  );
  const viewport = page.getViewport({ scale, rotation });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a miniatura.");

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
}

function getPageRotation(file, pageIndex) {
  return filePageRotations.get(file)?.get(pageIndex) || 0;
}

function rotatePage(file, pageIndex, offset) {
  let rotations = filePageRotations.get(file);
  if (!rotations) {
    rotations = new Map();
    filePageRotations.set(file, rotations);
  }

  const rotation = (getPageRotation(file, pageIndex) + offset + 360) % 360;
  if (rotation === 0) {
    rotations.delete(pageIndex);
  } else {
    rotations.set(pageIndex, rotation);
  }

  const fileIndex = selectedFiles.indexOf(file);
  if (fileIndex !== -1) {
    const thumbnail = fileList.querySelector(
      `.file-item[data-index="${fileIndex}"] .file-thumbnail`,
    );
    if (thumbnail) {
      thumbnail.textContent = "PDF";
      renderMergeThumbnail(file, thumbnail);
    }
  }
}

async function openPageRotationDialog(file) {
  const request = ++pageRotationRequest;
  pageRotationTitle.textContent = file.name;
  pageRotationSummary.textContent = "Lendo páginas...";
  pageRotationPreview.innerHTML = "";
  showPageRotationMessage("Carregando prévia das páginas...", true);
  pageRotationDialog.showModal();

  try {
    const pageCount = await getFilePageCount(file);
    if (request !== pageRotationRequest) return;

    pageRotationSummary.textContent =
      `${pageCount} ${pageCount === 1 ? "página" : "páginas"} • ` +
      "Gire cada página individualmente.";

    const pdf = await loadPdfJsDocument(file);
    if (request !== pageRotationRequest) {
      await pdf.destroy();
      return;
    }
    activePageRotationPdf = pdf;

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      if (request !== pageRotationRequest) return;

      const page = await pdf.getPage(pageIndex + 1);
      if (request !== pageRotationRequest) return;

      const pageCard = createPageRotationCard(file, page, pageIndex);
      pageRotationPreview.appendChild(pageCard.element);
      await pageCard.renderPreview();
    }

    if (request === pageRotationRequest) hidePageRotationMessage();
  } catch (error) {
    console.error(`Erro ao visualizar páginas de "${file.name}":`, error);
    if (request !== pageRotationRequest) return;

    const pdf = activePageRotationPdf;
    activePageRotationPdf = null;
    if (pdf) {
      pdf.destroy().catch((destroyError) =>
        console.error("Erro ao liberar a prévia do PDF:", destroyError),
      );
    }
    showPageRotationMessage(
      "Não foi possível carregar as páginas deste PDF.",
    );
  }
}

function createPageRotationCard(file, page, pageIndex) {
  const pageCard = document.createElement("article");
  pageCard.className = "rotation-page-card";

  const pagePreview = document.createElement("div");
  pagePreview.className = "rotation-page-canvas";
  pagePreview.textContent = "Carregando...";

  const pageLabel = document.createElement("span");
  pageLabel.className = "rotation-page-label";
  pageLabel.textContent = `Página ${pageIndex + 1}`;

  const rotationLabel = document.createElement("span");
  rotationLabel.className = "rotation-page-angle";

  let renderVersion = 0;
  const renderPreview = async () => {
    const currentRender = ++renderVersion;
    const rotation = getPageRotation(file, pageIndex);
    rotationLabel.textContent = `Rotação: ${rotation}°`;
    const canvas = await renderPdfPage(page, rotation);
    if (
      currentRender === renderVersion &&
      pagePreview.isConnected
    ) {
      pagePreview.replaceChildren(canvas);
    }
  };

  const rotationControls = document.createElement("div");
  rotationControls.className = "page-rotation-controls";

  const rotateLeftBtn = document.createElement("button");
  rotateLeftBtn.className = "rotate-page-btn";
  rotateLeftBtn.type = "button";
  rotateLeftBtn.textContent = "↶";
  rotateLeftBtn.title = `Girar página ${pageIndex + 1} 90 graus para a esquerda`;
  rotateLeftBtn.setAttribute("aria-label", rotateLeftBtn.title);
  rotateLeftBtn.addEventListener("click", () => {
    rotatePage(file, pageIndex, -90);
    renderPreview().catch((error) =>
      showPageRotationRenderError(file, pageIndex, pagePreview, error),
    );
  });

  const rotateRightBtn = document.createElement("button");
  rotateRightBtn.className = "rotate-page-btn";
  rotateRightBtn.type = "button";
  rotateRightBtn.textContent = "↻";
  rotateRightBtn.title = `Girar página ${pageIndex + 1} 90 graus para a direita`;
  rotateRightBtn.setAttribute("aria-label", rotateRightBtn.title);
  rotateRightBtn.addEventListener("click", () => {
    rotatePage(file, pageIndex, 90);
    renderPreview().catch((error) =>
      showPageRotationRenderError(file, pageIndex, pagePreview, error),
    );
  });

  rotationControls.appendChild(rotateLeftBtn);
  rotationControls.appendChild(rotateRightBtn);
  pageCard.appendChild(pagePreview);
  pageCard.appendChild(pageLabel);
  pageCard.appendChild(rotationLabel);
  pageCard.appendChild(rotationControls);
  return { element: pageCard, renderPreview };
}

function showPageRotationRenderError(file, pageIndex, preview, error) {
  console.error(
    `Erro ao atualizar a prévia da página ${pageIndex + 1} de "${file.name}":`,
    error,
  );
  preview.textContent = "Não foi possível atualizar a prévia.";
  showPageRotationMessage(
    `Não foi possível atualizar a página ${pageIndex + 1}.`,
  );
}

closePageRotationBtn.addEventListener("click", () =>
  pageRotationDialog.close(),
);
donePageRotationBtn.addEventListener("click", () =>
  pageRotationDialog.close(),
);

pageRotationDialog.addEventListener("close", () => {
  pageRotationRequest++;
  pageRotationPreview.innerHTML = "";
  const pdf = activePageRotationPdf;
  activePageRotationPdf = null;
  if (pdf) {
    pdf.destroy().catch((error) =>
      console.error("Erro ao liberar a prévia do PDF:", error),
    );
  }
  hidePageRotationMessage();
});

function showPageRotationMessage(text, processing = false) {
  pageRotationMessage.textContent = text;
  pageRotationMessage.classList.add("visible");
  pageRotationMessage.classList.toggle("processing", processing);
}

function hidePageRotationMessage() {
  pageRotationMessage.textContent = "";
  pageRotationMessage.classList.remove("visible", "processing");
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
    .forEach((item) =>
      item.classList.remove("dragging", "drag-before", "drag-after"),
    );
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
      let pdf;
      try {
        pdf = await PDFDocument.load(arrayBuffer);
      } catch (error) {
        throw new Error(
          `O arquivo "${file.name}" não contém um PDF válido ou está corrompido. Verifique o arquivo e tente novamente. (${error.message})`,
        );
      }
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      copiedPages.forEach((page, pageIndex) => {
        const pageRotation = getPageRotation(file, pageIndex);
        const rotation =
          (page.getRotation().angle + pageRotation + 360) % 360;
        page.setRotation(degrees(rotation));
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

  try {
    const pdf = await PDFDocument.create();

    for (const file of selectedImagesFiles) {
      const { image, width, height } = await embedImage(pdf, file);
      const rotation = imageRotations.get(file) || 0;
      const pageWidth = rotation % 180 === 0 ? width : height;
      const pageHeight = rotation % 180 === 0 ? height : width;
      const drawingRotation = (360 - rotation) % 360;
      let x = 0;
      let y = 0;
      if (drawingRotation === 90) x = height;
      if (drawingRotation === 180) {
        x = width;
        y = height;
      }
      if (drawingRotation === 270) y = width;
      const page = pdf.addPage([pageWidth, pageHeight]);
      page.drawImage(image, {
        x,
        y,
        width,
        height,
        rotate: degrees(drawingRotation),
      });
    }

    const pdfBytes = await pdf.save();
    downloadPdf(pdfBytes, "imagens.pdf");
    showConverterMessage("PDF convertido. O download foi iniciado.", "success");
  } catch (error) {
    console.error("Erro ao converter imagens para PDF:", error);
    showConverterMessage(
      "Não foi possível converter as imagens. Verifique os arquivos e tente novamente.",
    );
  } finally {
    setImageConversionState(false);
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
  renderSelectedImagePreviews();
}

function renderSelectedImagePreviews() {
  imagePreview.innerHTML = "";

  selectedImagesFiles.forEach((file) => {
    const card = document.createElement("article");
    card.className = "image-preview-card";

    const imageContainer = document.createElement("div");
    imageContainer.className = "image-preview-thumbnail";

    const image = document.createElement("img");
    image.alt = `Prévia de ${file.name}`;
    image.style.transform = `rotate(${imageRotations.get(file) || 0}deg)`;
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => URL.revokeObjectURL(objectUrl);
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      console.error(`Não foi possível gerar a miniatura de "${file.name}".`);
      imageContainer.textContent = "Prévia indisponível";
    };
    image.src = objectUrl;
    imageContainer.appendChild(image);

    const fileName = document.createElement("span");
    fileName.className = "image-preview-name";
    fileName.textContent = file.name;
    fileName.title = file.name;

    const rotationLabel = document.createElement("span");
    rotationLabel.className = "image-preview-angle";
    rotationLabel.textContent = `Rotação: ${imageRotations.get(file) || 0}°`;

    const controls = document.createElement("div");
    controls.className = "image-rotation-controls";
    [-90, 90].forEach((offset) => {
      const button = document.createElement("button");
      const direction = offset < 0 ? "esquerda" : "direita";
      button.className = "image-rotate-btn";
      button.type = "button";
      button.textContent = offset < 0 ? "↶" : "↻";
      button.title = `Girar ${file.name} 90 graus para a ${direction}`;
      button.setAttribute("aria-label", button.title);
      button.disabled = isConvertingImages;
      button.addEventListener("click", () => {
        const rotation =
          ((imageRotations.get(file) || 0) + offset + 360) % 360;
        imageRotations.set(file, rotation);
        image.style.transform = `rotate(${rotation}deg)`;
        rotationLabel.textContent = `Rotação: ${rotation}°`;
      });
      controls.appendChild(button);
    });

    card.appendChild(imageContainer);
    card.appendChild(fileName);
    card.appendChild(rotationLabel);
    card.appendChild(controls);
    imagePreview.appendChild(card);
  });
}

function setImageConversionState(isConverting) {
  isConvertingImages = isConverting;
  convertBtn.disabled = isConverting || selectedImagesFiles.length === 0;
  convertBtn.textContent = isConverting
    ? "Convertendo..."
    : "Converter para PDF";
  imageInput.disabled = isConverting;
  imagePreview.querySelectorAll("button").forEach((button) => {
    button.disabled = isConverting;
  });
  setToolTabsDisabled(isConverting);
  if (isConverting) {
    converterMessage.textContent = "Processando imagens...";
    converterMessage.classList.add("visible", "processing");
  } else if (converterMessage.classList.contains("processing")) {
    hideConverterMessage();
  }
}

function showConverterMessage(text, type = "error") {
  converterMessage.textContent = text;
  converterMessage.classList.add("visible");
  converterMessage.classList.toggle("success", type === "success");
  converterMessage.classList.remove("processing");
}

function hideConverterMessage() {
  converterMessage.textContent = "";
  converterMessage.classList.remove("visible", "processing", "success");
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
  const url = URL.createObjectURL(
    new Blob([pdfBytes], { type: "application/pdf" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

splitPdfInput.addEventListener("change", async () => {
  const request = ++splitPreviewRequest;
  splitPageRotations.clear();
  selectedPageNumbers.clear();
  splitPreview.innerHTML = "";
  pageRangeInput.value = "";
  selectedSplitFile = null;
  splitPdfPageCount = 0;
  updateSelectedSplitPdf();
  hideSplitterMessage();

  const file = Array.from(splitPdfInput.files).find(
    (item) =>
      item.type === "application/pdf" ||
      item.name.toLowerCase().endsWith(".pdf"),
  );

  if (!file) {
    showSplitterMessage("Selecione um arquivo PDF válido.");
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showSplitterMessage("O PDF excede o limite de 50MB.");
    return;
  }

  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    if (request !== splitPreviewRequest) return;
    selectedSplitFile = file;
    splitPdfPageCount = pdf.getPageCount();
    pageRangeInput.value = "";
    await renderPdfThumbnails(file, request);
    if (request !== splitPreviewRequest) return;
    hideSplitterMessage();
  } catch (error) {
    console.error("Erro ao abrir PDF para separação:", error);
    if (request !== splitPreviewRequest) return;
    selectedSplitFile = null;
    splitPdfPageCount = 0;
    showSplitterMessage(
      "Não foi possível abrir este PDF. Verifique se ele não está protegido.",
    );
  }

  updateSelectedSplitPdf();
});

async function renderPdfThumbnails(file, request) {
  const pdf = await loadPdfJsDocument(file);

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      if (request !== splitPreviewRequest) return;

      const page = await pdf.getPage(pageNumber);
      const card = document.createElement("div");
      card.className = "page-thumbnail";
      card.dataset.page = pageNumber;

      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "page-selection-btn";
      selectButton.setAttribute("aria-label", `Selecionar página ${pageNumber}`);
      selectButton.title = `Página ${pageNumber}`;

      const canvas = await renderPdfPage(
        page,
        splitPageRotations.get(pageNumber - 1) || 0,
        150,
      );
      selectButton.appendChild(canvas);

      const label = document.createElement("span");
      label.textContent = `Página ${pageNumber}`;
      selectButton.appendChild(label);
      selectButton.addEventListener("click", () =>
        togglePageThumbnail(pageNumber),
      );

      const rotationLabel = document.createElement("span");
      rotationLabel.className = "split-page-angle";
      rotationLabel.textContent =
        `Rotação: ${splitPageRotations.get(pageNumber - 1) || 0}°`;

      const controls = document.createElement("div");
      controls.className = "split-page-controls";
      let renderVersion = 0;

      const updatePreview = async () => {
        const currentRender = ++renderVersion;
        const rotation = splitPageRotations.get(pageNumber - 1) || 0;
        rotationLabel.textContent = `Rotação: ${rotation}°`;
        const previewPdf = await loadPdfJsDocument(file);
        try {
          if (request !== splitPreviewRequest) return;
          const previewPage = await previewPdf.getPage(pageNumber);
          const rotatedCanvas = await renderPdfPage(previewPage, rotation, 150);
          if (
            currentRender === renderVersion &&
            request === splitPreviewRequest
          ) {
            selectButton.querySelector("canvas").replaceWith(rotatedCanvas);
          }
        } finally {
          await previewPdf.destroy();
        }
      };

      [-90, 90].forEach((offset) => {
        const button = document.createElement("button");
        const direction = offset < 0 ? "esquerda" : "direita";
        button.className = "split-rotate-btn";
        button.type = "button";
        button.textContent = offset < 0 ? "↶" : "↻";
        button.title = `Girar página ${pageNumber} 90 graus para a ${direction}`;
        button.setAttribute("aria-label", button.title);
        button.addEventListener("click", () => {
          const rotation =
            ((splitPageRotations.get(pageNumber - 1) || 0) +
              offset +
              360) %
            360;
          splitPageRotations.set(pageNumber - 1, rotation);
          updatePreview().catch((error) => {
            console.error(
              `Erro ao girar a página ${pageNumber} de "${file.name}":`,
              error,
            );
            showSplitterMessage(
              `Não foi possível atualizar a prévia da página ${pageNumber}.`,
            );
          });
        });
        controls.appendChild(button);
      });

      card.appendChild(selectButton);
      card.appendChild(rotationLabel);
      card.appendChild(controls);
      splitPreview.appendChild(card);
    }
  } finally {
    await pdf.destroy();
  }
}

function togglePageThumbnail(pageNumber) {
  if (selectedPageNumbers.has(pageNumber)) {
    selectedPageNumbers.delete(pageNumber);
  } else {
    selectedPageNumbers.add(pageNumber);
  }

  pageRangeInput.value = Array.from(selectedPageNumbers)
    .sort((a, b) => a - b)
    .join(", ");
  syncThumbnailSelection();
}

function syncThumbnailSelection() {
  splitPreview.querySelectorAll(".page-thumbnail").forEach((thumbnail) => {
    const pageNumber = Number(thumbnail.dataset.page);
    const isSelected = selectedPageNumbers.has(pageNumber);
    thumbnail.classList.toggle("selected", isSelected);
    thumbnail
      .querySelector(".page-selection-btn")
      .setAttribute("aria-pressed", String(isSelected));
  });
}

pageRangeInput.addEventListener("input", () => {
  const groups = parsePageRanges(pageRangeInput.value, splitPdfPageCount);
  selectedPageNumbers.clear();
  if (groups) {
    groups.flat().forEach((pageNumber) => selectedPageNumbers.add(pageNumber));
  } else if (pageRangeInput.value.trim()) {
    selectedPageNumbers.clear();
  }
  syncThumbnailSelection();
});

function updateSelectedSplitPdf() {
  if (!selectedSplitFile) {
    selectedSplitPdf.textContent = "Nenhum PDF selecionado";
  } else {
    selectedSplitPdf.textContent =
      `${selectedSplitFile.name} • ${splitPdfPageCount} ` +
      (splitPdfPageCount === 1 ? "página" : "páginas");
  }
  splitBtn.disabled = !selectedSplitFile || isSplittingPdf;
}

function applySplitPageRotation(page, pageNumber) {
  const rotation =
    (page.getRotation().angle +
      (splitPageRotations.get(pageNumber - 1) || 0) +
      360) %
    360;
  page.setRotation(degrees(rotation));
}

splitBtn.addEventListener("click", async () => {
  if (!selectedSplitFile || isSplittingPdf) return;

  hideSplitterMessage();
  const groups = parsePageRanges(pageRangeInput.value, splitPdfPageCount);
  if (!groups) {
    showSplitterMessage(
      `Informe páginas válidas entre 1 e ${splitPdfPageCount}, por exemplo: 1-3, 5, 8-10.`,
    );
    return;
  }

  setSplitterState(true);

  try {
    const sourcePdf = await PDFDocument.load(
      await selectedSplitFile.arrayBuffer(),
    );
    const zip = typeof JSZip === "undefined" ? null : new JSZip();
    if (!zip) throw new Error("O serviço de compactação não foi carregado.");

    const baseName =
      selectedSplitFile.name.replace(/\.pdf$/i, "") || "documento";

    if (!pageRangeInput.value.trim()) {
      for (let pageIndex = 0; pageIndex < splitPdfPageCount; pageIndex++) {
        const outputPdf = await PDFDocument.create();
        const [page] = await outputPdf.copyPages(sourcePdf, [pageIndex]);
        applySplitPageRotation(page, pageIndex + 1);
        outputPdf.addPage(page);
        zip.file(
          `${baseName}_pagina_${String(pageIndex + 1).padStart(3, "0")}.pdf`,
          await outputPdf.save(),
        );
      }
    } else {
      for (let index = 0; index < groups.length; index++) {
        const pageIndices = groups[index].map((pageNumber) => pageNumber - 1);
        const outputPdf = await PDFDocument.create();
        const pages = await outputPdf.copyPages(sourcePdf, pageIndices);
        pages.forEach((page, pageIndex) => {
          applySplitPageRotation(page, pageIndices[pageIndex] + 1);
          outputPdf.addPage(page);
        });

        const rangeName =
          groups[index].length === 1
            ? `pagina_${String(groups[index][0]).padStart(3, "0")}`
            : `paginas_${String(groups[index][0]).padStart(3, "0")}-${String(
                groups[index][groups[index].length - 1],
              ).padStart(3, "0")}`;
        zip.file(`${baseName}_${rangeName}.pdf`, await outputPdf.save());
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    downloadFile(zipBlob, `${baseName}_separado.zip`);
    showSplitterMessage("PDF separado. O download foi iniciado.", "success");
  } catch (error) {
    console.error("Erro ao separar PDF:", error);
    showSplitterMessage(
      "Não foi possível separar este PDF. Verifique os intervalos e tente novamente.",
    );
  } finally {
    setSplitterState(false);
  }
});

function parsePageRanges(value, pageCount) {
  if (!value.trim()) {
    return Array.from({ length: pageCount }, (_, index) => [index + 1]);
  }

  const ranges = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (ranges.length === 0) return null;

  const groups = [];
  for (const range of ranges) {
    if (/^\d+$/.test(range)) {
      const page = Number(range);
      if (page < 1 || page > pageCount) return null;
      groups.push([page]);
      continue;
    }

    const match = range.match(/^(\d+)\s*-\s*(\d+)$/);
    if (!match) return null;
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start < 1 || end < start || end > pageCount) return null;
    const pages = [];
    for (let page = start; page <= end; page++) pages.push(page);
    groups.push(pages);
  }
  return groups;
}

function setSplitterState(isSplitting) {
  isSplittingPdf = isSplitting;
  splitBtn.disabled = isSplitting || !selectedSplitFile;
  splitBtn.textContent = isSplitting ? "Separando..." : "Separar PDF";
  splitPdfInput.disabled = isSplitting;
  pageRangeInput.disabled = isSplitting;
  splitPreview.querySelectorAll("button").forEach((button) => {
    button.disabled = isSplitting;
  });
  setToolTabsDisabled(isSplitting);
  if (isSplitting) {
    splitterMessage.textContent = "Processando páginas...";
    splitterMessage.classList.add("visible", "processing");
  } else if (splitterMessage.classList.contains("processing")) {
    hideSplitterMessage();
  }
}

function showSplitterMessage(text, type = "error") {
  splitterMessage.textContent = text;
  splitterMessage.classList.add("visible");
  splitterMessage.classList.toggle("success", type === "success");
  splitterMessage.classList.remove("processing");
}

function hideSplitterMessage() {
  splitterMessage.textContent = "";
  splitterMessage.classList.remove("visible", "processing", "success");
}
