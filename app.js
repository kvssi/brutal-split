/**
 * BRUTAL SPLIT - NEO-BRUTALIST EDITION
 */

const els = {
    uploadSection: document.getElementById('upload-section'),
    configSection: document.getElementById('config-section'),
    fileInput: document.getElementById('file-input'),
    dropZone: document.getElementById('drop-zone'),
    fileName: document.getElementById('file-name'),
    fileSize: document.getElementById('file-size'),
    totalPages: document.getElementById('total-pages'),
    maxParts: document.getElementById('max-parts'),
    partsCount: document.getElementById('parts-count'),
    decParts: document.getElementById('dec-parts'),
    incParts: document.getElementById('inc-parts'),
    previewBody: document.getElementById('preview-body'),
    splitBtn: document.getElementById('split-btn'),
    resetBtn: document.getElementById('reset-btn'),
    progressContainer: document.getElementById('progress-container'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent'),
    outputSection: document.getElementById('output-section'),
    downloadList: document.getElementById('download-list'),
    modeTabs: document.querySelectorAll('.mode-tab'),
    equalControls: document.getElementById('equal-controls'),
    customControls: document.getElementById('custom-controls'),
    customRanges: document.getElementById('custom-ranges'),
    rangeError: document.getElementById('range-error'),
    namingTemplate: document.getElementById('naming-template'),
    filenamePreview: document.getElementById('filename-preview'),
    errorPanel: document.getElementById('error-panel'),
    errorMessage: document.getElementById('error-message'),
    errorTech: document.getElementById('error-tech'),
    errorClose: document.getElementById('error-close'),
    offlineBadge: document.getElementById('offline-badge'),
    swStatus: document.getElementById('sw-status')
};

let currentPdf = null;
let splitMode = 'equal';

document.addEventListener('DOMContentLoaded', () => {
    initServiceWorker();
    setupEventListeners();
    updateFilenamePreview();
});

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => {
                els.offlineBadge.classList.remove('hidden');
                els.swStatus.textContent = 'ONLINE_READY';
            })
            .catch(() => {
                els.swStatus.textContent = 'SW_ERROR';
            });
    } else {
        els.swStatus.textContent = 'NOT_SUPPORTED';
    }
}

function setupEventListeners() {
    // Upload
    els.dropZone.addEventListener('click', () => els.fileInput.click());
    els.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.dropZone.classList.add('drag-over');
    });
    els.dropZone.addEventListener('dragleave', () => {
        els.dropZone.classList.remove('drag-over');
    });
    els.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        els.dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    els.fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Mode Tabs
    els.modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            els.modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            splitMode = tab.dataset.mode;
            els.equalControls.classList.toggle('hidden', splitMode !== 'equal');
            els.customControls.classList.toggle('hidden', splitMode !== 'custom');
            updatePreview();
        });
    });

    // Number Controls
    els.decParts.addEventListener('click', () => {
        els.partsCount.value = Math.max(1, parseInt(els.partsCount.value) - 1);
        updatePreview();
    });
    els.incParts.addEventListener('click', () => {
        const max = currentPdf ? currentPdf.pageCount : 999;
        els.partsCount.value = Math.min(max, parseInt(els.partsCount.value) + 1);
        updatePreview();
    });
    els.partsCount.addEventListener('input', updatePreview);
    els.customRanges.addEventListener('input', updatePreview);
    els.namingTemplate.addEventListener('input', updateFilenamePreview);

    // Actions
    els.splitBtn.addEventListener('click', startSplit);
    els.resetBtn.addEventListener('click', resetApp);
    els.errorClose.addEventListener('click', () => els.errorPanel.classList.add('hidden'));
}

async function handleFile(file) {
    if (file.type !== 'application/pdf') {
        showError('INVALID_FILE_TYPE', 'Nur .PDF Dateien erlaubt');
        return;
    }

    try {
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(bytes);
        const pageCount = pdfDoc.getPageCount();

        currentPdf = {
            bytes,
            name: file.name.replace('.pdf', ''),
            doc: pdfDoc,
            pageCount
        };

        els.fileName.textContent = file.name;
        els.fileSize.textContent = formatBytes(file.size);
        els.totalPages.textContent = pageCount;
        els.maxParts.textContent = pageCount;
        els.partsCount.max = pageCount;

        els.uploadSection.classList.add('hidden');
        els.configSection.classList.remove('hidden');
        
        updatePreview();
    } catch (err) {
        showError('PDF_LOAD_ERROR', err.message);
    }
}

function updatePreview() {
    if (!currentPdf) return;
    const parts = calculateParts();
    renderPreviewTable(parts);
    updateFilenamePreview();
}

function calculateParts() {
    const total = currentPdf.pageCount;
    let parts = [];

    if (splitMode === 'equal') {
        let count = parseInt(els.partsCount.value) || 1;
        count = Math.max(1, Math.min(count, total));
        
        const baseSize = Math.floor(total / count);
        const remainder = total % count;
        
        let currentPage = 1;
        for (let i = 0; i < count; i++) {
            const size = baseSize + (i < remainder ? 1 : 0);
            parts.push({
                start: currentPage,
                end: currentPage + size - 1,
                index: i + 1
            });
            currentPage += size;
        }
    } else {
        const input = els.customRanges.value.trim();
        if (!input) return [];
        
        const ranges = input.split(',');
        let valid = true;
        
        ranges.forEach((rangeStr, idx) => {
            const match = rangeStr.trim().match(/^(\d+)-(\d+)$/);
            if (match) {
                const start = parseInt(match[1]);
                const end = parseInt(match[2]);
                if (start > 0 && end <= total && start <= end) {
                    parts.push({ start, end, index: idx + 1 });
                } else {
                    valid = false;
                }
            } else {
                valid = false;
            }
        });

        els.rangeError.classList.toggle('hidden', valid || !input);
    }
    
    return parts;
}

function renderPreviewTable(parts) {
    els.previewBody.innerHTML = '';
    
    if (parts.length === 0) {
        els.previewBody.innerHTML = '<tr class="empty-row"><td colspan="4">[WARTE_AUF_INPUT...]</td></tr>';
        return;
    }

    parts.forEach(part => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${part.index.toString().padStart(2, '0')}</td>
            <td>${generateFilename(part.index, part.start, part.end)}</td>
            <td>${part.start}-${part.end}</td>
            <td>${part.end - part.start + 1}</td>
        `;
        els.previewBody.appendChild(row);
    });
}

function generateFilename(index, start, end) {
    const template = els.namingTemplate.value || '{name}_part_{i}_pages_{start}-{end}.pdf';
    return template
        .replace(/{name}/g, currentPdf ? currentPdf.name : 'doc')
        .replace(/{i}/g, index)
        .replace(/{start}/g, start)
        .replace(/{end}/g, end);
}

function updateFilenamePreview() {
    els.filenamePreview.textContent = generateFilename(1, 1, 5);
}

async function startSplit() {
    if (!currentPdf) return;
    
    const parts = calculateParts();
    if (parts.length === 0) {
        showError('NO_VALID_PARTS', 'Keine gültigen Teile zum Splitten');
        return;
    }

    els.splitBtn.disabled = true;
    els.splitBtn.querySelector('.btn-text').textContent = 'VERARBEITE...';
    els.progressContainer.classList.remove('hidden');
    els.outputSection.classList.add('hidden');

    try {
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const percent = Math.round((i / parts.length) * 100);
            
            updateProgress(percent, `Creating part ${part.index}/${parts.length}...`);
            await new Promise(r => setTimeout(r, 50));
            
            const newPdf = await PDFLib.PDFDocument.create();
            const pageIndices = [];
            for (let p = part.start; p <= part.end; p++) {
                pageIndices.push(p - 1);
            }
            
            const copiedPages = await newPdf.copyPages(currentPdf.doc, pageIndices);
            copiedPages.forEach(page => newPdf.addPage(page));
            
            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const item = document.createElement('div');
            item.className = 'download-item';
            item.innerHTML = `
                <div class="download-filename">${generateFilename(part.index, part.start, part.end)}</div>
                <div class="download-meta">${part.start}-${part.end} • ${formatBytes(blob.size)}</div>
                <a href="${url}" download="${generateFilename(part.index, part.start, part.end)}" class="download-btn">DOWNLOAD</a>
            `;
            
            if (i === 0) els.downloadList.innerHTML = '';
            els.downloadList.appendChild(item);
        }
        
        updateProgress(100, 'Complete!');
        els.outputSection.classList.remove('hidden');
        els.outputSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (err) {
        showError('SPLIT_ERROR', err.message);
    } finally {
        els.splitBtn.disabled = false;
        els.splitBtn.querySelector('.btn-text').textContent = 'AUSFÜHREN';
    }
}

function updateProgress(percent, text) {
    els.progressBar.style.width = percent + '%';
    els.progressText.textContent = text;
    els.progressPercent.textContent = `[${percent}%]`;
}

function resetApp() {
    currentPdf = null;
    els.fileInput.value = '';
    els.partsCount.value = 2;
    els.customRanges.value = '';
    els.uploadSection.classList.remove('hidden');
    els.configSection.classList.add('hidden');
    els.outputSection.classList.add('hidden');
    els.progressContainer.classList.add('hidden');
    els.errorPanel.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(msg, tech) {
    els.errorMessage.textContent = msg;
    els.errorTech.textContent = tech;
    els.errorPanel.classList.remove('hidden');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
}
