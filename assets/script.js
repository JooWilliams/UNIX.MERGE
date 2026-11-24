const { PDFDocument, degrees } = PDFLib;

let selectedFiles = [];
const fileRotations = new WeakMap();
const fileThumbnailPromises = new WeakMap();
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
const splitterDialog = document.getElementById("splitterDialog");
const openSplitterBtn = document.getElementById("openSplitterBtn");
const closeSplitterBtn = document.getElementById("closeSplitterBtn");
const cancelSplitterBtn = document.getElementById("cancelSplitterBtn");
const splitPdfInput = document.getElementById("splitPdfInput");
const selectedSplitPdf = document.getElementById("selectedSplitPdf");
const pageRangeInput = document.getElementById("pageRangeInput");
const splitterMessage = document.getElementById("splitterMessage");
const splitBtn = document.getElementById("splitBtn");
const splitPreview = document.getElementById("splitPreview");
let selectedSplitFile = null;
let splitPdfPageCount = 0;
let isSplittingPdf = false;
let selectedPageNumbers = new Set();

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
    renderMergeThumbnail(file, thumbnail);

    const fileDetails = document.createElement("div");
    fileDetails.className = "file-details";

    const fileName = document.createElement("span");
    fileName.className = "file-name";
    fileName.textContent = file.name;

    const fileSize = document.createElement("span");
    fileSize.className = "file-size";
    fileSize.textContent = formatFileSize(file.size);

    fileDetails.appendChild(fileName);
    fileDetails.appendChild(fileSize);

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

    const rotationControls = document.createElement("div");
    rotationControls.className = "file-rotation-controls";

    const rotateLeftBtn = document.createElement("button");
    rotateLeftBtn.className = "rotate-file-btn";
    rotateLeftBtn.type = "button";
    rotateLeftBtn.textContent = "↶";
    rotateLeftBtn.title = `Girar ${file.name} 90 graus para a esquerda`;
    rotateLeftBtn.setAttribute("aria-label", rotateLeftBtn.title);
    rotateLeftBtn.onclick = () => rotateFile(file, -90);

    const rotateRightBtn = document.createElement("button");
    rotateRightBtn.className = "rotate-file-btn";
    rotateRightBtn.type = "button";
    rotateRightBtn.textContent = "↻";
    rotateRightBtn.title = `Girar ${file.name} 90 graus para a direita`;
    rotateRightBtn.setAttribute("aria-label", rotateRightBtn.title);
    rotateRightBtn.onclick = () => rotateFile(file, 90);

    rotationControls.appendChild(rotateLeftBtn);
    rotationControls.appendChild(rotateRightBtn);

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
    fileItem.appendChild(orderControls);
    fileItem.appendChild(rotationControls);
    fileItem.appendChild(removeBtn);
    fileList.appendChild(fileItem);
  });

  clearBtn.style.display = selectedFiles.length > 0 ? "block" : "none";
}

async function renderMergeThumbnail(file, container) {
  try {
    let rotations = fileThumbnailPromises.get(file);
    if (!rotations) {
      rotations = new Map();
      fileThumbnailPromises.set(file, rotations);
    }

    const rotation = fileRotations.get(file) || 0;
    let thumbnailPromise = rotations.get(rotation);
    if (!thumbnailPromise) {
      thumbnailPromise = createMergeThumbnail(file, rotation);
      rotations.set(rotation, thumbnailPromise);
    }

    const thumbnailUrl = await thumbnailPromise;
    if (!container.isConnected) return;
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

async function createMergeThumbnail(file, rotation) {
  if (typeof pdfjsLib === "undefined") {
    throw new Error("O visualizador de páginas não foi carregado.");
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({
    scale: 0.28,
    rotation: (page.rotate + rotation + 360) % 360,
  });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a miniatura.");

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/png");
}

function rotateFile(file, offset) {
  const currentRotation = fileRotations.get(file) || 0;
  fileRotations.set(file, (currentRotation + offset + 360) % 360);
  updateFileList();
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

      copiedPages.forEach((page) => {
        const rotation =
          (page.getRotation().angle + (fileRotations.get(file) || 0)) % 360;
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
  convertBtn.textContent = isConverting
    ? "Convertendo..."
    : "Converter para PDF";
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

openSplitterBtn.addEventListener("click", () => {
  selectedSplitFile = null;
  splitPdfPageCount = 0;
  selectedPageNumbers.clear();
  splitPreview.innerHTML = "";
  splitPdfInput.value = "";
  pageRangeInput.value = "";
  updateSelectedSplitPdf();
  hideSplitterMessage();
  splitterDialog.showModal();
});

closeSplitterBtn.addEventListener("click", closeSplitterDialog);
cancelSplitterBtn.addEventListener("click", closeSplitterDialog);

splitterDialog.addEventListener("cancel", (event) => {
  if (isSplittingPdf) event.preventDefault();
});

splitPdfInput.addEventListener("change", async () => {
  const file = Array.from(splitPdfInput.files).find(
    (item) =>
      item.type === "application/pdf" ||
      item.name.toLowerCase().endsWith(".pdf"),
  );

  if (!file) {
    selectedSplitFile = null;
    splitPdfPageCount = 0;
    updateSelectedSplitPdf();
    showSplitterMessage("Selecione um arquivo PDF válido.");
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    selectedSplitFile = null;
    splitPdfPageCount = 0;
    updateSelectedSplitPdf();
    showSplitterMessage("O PDF excede o limite de 50MB.");
    return;
  }

  try {
    const pdf = await PDFDocument.load(await file.arrayBuffer());
    selectedSplitFile = file;
    splitPdfPageCount = pdf.getPageCount();
    selectedPageNumbers.clear();
    pageRangeInput.value = "";
    await renderPdfThumbnails(file);
    hideSplitterMessage();
  } catch (error) {
    console.error("Erro ao abrir PDF para separação:", error);
    selectedSplitFile = null;
    splitPdfPageCount = 0;
    showSplitterMessage(
      "Não foi possível abrir este PDF. Verifique se ele não está protegido.",
    );
  }

  updateSelectedSplitPdf();
});

async function renderPdfThumbnails(file) {
  splitPreview.innerHTML = "";

  if (typeof pdfjsLib === "undefined") {
    throw new Error("O visualizador de páginas não foi carregado.");
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.32 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const thumbnail = document.createElement("button");
    thumbnail.type = "button";
    thumbnail.className = "page-thumbnail";
    thumbnail.dataset.page = pageNumber;
    thumbnail.setAttribute("aria-label", `Selecionar página ${pageNumber}`);
    thumbnail.title = `Página ${pageNumber}`;
    thumbnail.appendChild(canvas);

    const label = document.createElement("span");
    label.textContent = `Página ${pageNumber}`;
    thumbnail.appendChild(label);
    thumbnail.addEventListener("click", () => togglePageThumbnail(pageNumber));
    splitPreview.appendChild(thumbnail);
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
    thumbnail.setAttribute("aria-pressed", String(isSelected));
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
        pages.forEach((page) => outputPdf.addPage(page));

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
    closeSplitterDialog();
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
  closeSplitterBtn.disabled = isSplitting;
  cancelSplitterBtn.disabled = isSplitting;
  if (isSplitting) {
    splitterMessage.textContent = "Processando páginas...";
    splitterMessage.classList.add("visible", "processing");
  } else if (splitterMessage.classList.contains("processing")) {
    hideSplitterMessage();
  }
}

function closeSplitterDialog() {
  if (isSplittingPdf) return;
  splitterDialog.close();
}

function showSplitterMessage(text) {
  splitterMessage.textContent = text;
  splitterMessage.classList.add("visible");
  splitterMessage.classList.remove("processing");
}

function hideSplitterMessage() {
  splitterMessage.textContent = "";
  splitterMessage.classList.remove("visible", "processing");
}
