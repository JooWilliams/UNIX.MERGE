const { PDFDocument } = PDFLib;
        
        let selectedFiles = [];
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const fileList = document.getElementById('fileList');
        const mergeBtn = document.getElementById('mergeBtn');
        const clearBtn = document.getElementById('clearBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const message = document.getElementById('message');

        // Click para abrir seletor de arquivos
        uploadArea.addEventListener('click', () => fileInput.click());

        // Prevenir comportamento padrão de drag
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight ao arrastar
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            });
        });

        // Drop de arquivos
        uploadArea.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(file => 
                file.type === 'application/pdf'
            );
            addFiles(files);
        });

        // Seleção de arquivos
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            addFiles(files);
            fileInput.value = ''; // Limpar input
        });

        function addFiles(files) {
            selectedFiles = [...selectedFiles, ...files];
            // Ordenar alfabeticamente por nome do arquivo
            selectedFiles.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
            updateFileList();
            updateMergeButton();
        }

        function updateFileList() {
            fileList.innerHTML = '';
            
            selectedFiles.forEach((file, index) => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                
                const fileName = document.createElement('span');
                fileName.className = 'file-name';
                fileName.textContent = file.name;
                
                const fileSize = document.createElement('span');
                fileSize.className = 'file-size';
                fileSize.textContent = formatFileSize(file.size);
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.textContent = '✕';
                removeBtn.onclick = () => removeFile(index);
                
                fileItem.appendChild(fileName);
                fileItem.appendChild(fileSize);
                fileItem.appendChild(removeBtn);
                fileList.appendChild(fileItem);
            });

            clearBtn.style.display = selectedFiles.length > 0 ? 'block' : 'none';
        }

        function removeFile(index) {
            selectedFiles.splice(index, 1);
            updateFileList();
            updateMergeButton();
        }

        function updateMergeButton() {
            mergeBtn.disabled = selectedFiles.length < 2;
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        clearBtn.addEventListener('click', () => {
            selectedFiles = [];
            updateFileList();
            updateMergeButton();
            hideMessage();
        });

        mergeBtn.addEventListener('click', async () => {
            if (selectedFiles.length < 2) {
                showMessage('Selecione pelo menos 2 arquivos PDF', 'error');
                return;
            }

            try {
                mergeBtn.disabled = true;
                clearBtn.disabled = true;
                progressContainer.style.display = 'block';
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
                const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                
                // Download automático
                const link = document.createElement('a');
                link.href = url;
                link.download = 'merged_document.pdf';
                link.click();
                
                URL.revokeObjectURL(url);
                
                showMessage('✓ PDFs mesclados com sucesso!', 'success');
                
            } catch (error) {
                console.error('Erro ao mesclar PDFs:', error);
                showMessage('✗ Erro ao mesclar PDFs: ' + error.message, 'error');
            } finally {
                mergeBtn.disabled = false;
                clearBtn.disabled = false;
                progressContainer.style.display = 'none';
                updateProgress(0);
            }
        });

        function updateProgress(percent) {
            progressFill.style.width = percent + '%';
            progressFill.textContent = percent + '%';
        }

        function showMessage(text, type) {
            message.textContent = text;
            message.className = 'message ' + type;
            message.style.display = 'block';
        }

        function hideMessage() {
            message.style.display = 'none';
        }