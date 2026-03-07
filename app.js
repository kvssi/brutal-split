// BRUTAL SPLIT - TRUE NEO-BRUTALIST EDITION
// No compromises. Pure functionality.

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
    previewCount: document.getElementById('preview-count'),
    splitBtn: document.getElementById('split-btn'),
    resetBtn: document.getElementById('reset-btn'),
    progressContainer: document.getElementById('progress-container'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent'),
    outputSection: document.getElementById('output-section'),
    downloadList: document.getElementById('download-list'),
    modeOptions: document.querySelectorAll('.mode-option'),
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
    swStatus: document.getElementById('sw-status')
};

let currentPdf = null;
let splitMode = 'equal';

document.addEventListener('DOMContentLoaded', () => {
    initSW();
    bindEvents();
    updatePreview();
});

function initSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => {
                els.swStatus.textContent = 'ONLINE_READY';
                els.swStatus.style.color = 'var(--c-success)';
            })
            .catch(() => {
                els.swStatus.textContent = 'OFFLINE_MODE';
            });
    }
}

function bindEvents() {
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

    // Mode selection
    els.modeOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            els.modeOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            splitMode = opt.dataset.mode;
            els.equalControls.classList.toggle('hidden', splitMode !== 'equal');
            els.customControls.classList.toggle('hidden', splitMode !== 'custom');
            updatePreview();
        });
    });

    // Number controls
    els.decParts.addEventListener('click', () => {
        const val = Math.max(1, parseInt(els.partsCount.value) - 1);
        els.partsCount.value = val;
        updatePreview();
    });
    els.incParts.addEventListener('click', () => {
        const max = currentPdf ? currentPdf.pageCount : 999;
        const val = Math.min(max, parseInt(els.partsCount.value) + 1);
        els.partsCount.value = val;
        updatePreview();
    });
    els.partsCount.addEventListener('input', updatePreview);
    els.customRanges.addEventListener('input', updatePreview);
    els.namingTemplate.addEventListener('input', updateFilenamePreview);

    // Actions
    els.splitBtn.addEventListener('click', executeSplit);
    els.resetBtn.addEventListener('click', resetAll);
    els.errorClose.addEventListener('click', () => els.errorPanel.classList.add('hidden'));
}

async function handleFile(file) {
    if (file.type !== 'application/pdf') {
        showError('INVALID_FILE_TYPE', 'Only PDF files accepted');
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

        els.uploadSection.classList.add('hidden');
        els.configSection.classList.remove('hidden');
        
        updatePreview();
    } catch (err) {
        showError('PDF_LOAD_FAILED', err.message);
    }
}

function updatePreview() {
    if (!currentPdf) return;
    const parts = calculateParts();
    renderMatrix(parts);
    updateFilenamePreview();
}

function calculateParts() {
    const total = currentPdf.pageCount;
    let parts = [];

    if (splitMode === 'equal') {
        let count = parseInt(els.partsCount.value) || 1;
        count = Math.max(1, Math.min(count, total));
        
        const base = Math.floor(total / count);
        const rem = total % count;
        
        let page = 1;
        for (let i = 0; i < count; i++) {
            const size = base + (i < rem ? 1 : 0);
            parts.push({ start: page, end: page + size - 1, index: i + 1 });
            page += size;
        }
    } else {
        const input = els.customRanges.value.trim();
        if (!input) return [];
        
        const ranges = input.split(',');
        let valid = true;
        
        ranges.forEach((r, i) => {
            const m = r.trim().match(/^(\d+)-(\d+)$/);
            if (m) {
                const s = parseInt(m[1]), e = parseInt(m[2]);
                if (s > 0 && e <= total && s <= e) {
                    parts.push({ start: s, end: e, index: i + 1 });
                } else valid = false;
            } else valid = false;
        });

        els.rangeError.classList.toggle('hidden', valid || !input);
    }
    
    return parts;
}

function renderMatrix(parts) {
    els.previewBody.innerHTML = '';
    els.previewCount.textContent = `${parts.length} PARTS`;
    
    if (parts.length === 0) {
        els.previewBody.innerHTML = `
            <tr class="matrix-empty">
                <td colspan="4">
                    <div class="empty-state">
                        <div class="empty-icon">◌</div>
                        <div>AWAITING PARAMETERS</div>
                    </div>
                </td>
            </tr>`;
        return;
    }

    parts.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.index.toString().padStart(2, '0')}</td>
            <td>${generateFilename(p.index, p.start, p.end)}</td>
            <td>${p.start} → ${p.end}</td>
            <td>${p.end - p.start + 1}</td>
        `;
        els.previewBody.appendChild(row);
    });
}

function generateFilename(i, start, end) {
    const t = els.namingTemplate.value || '{name}_part_{i}_pages_{start}-{end}.pdf';
    return t
        .replace(/{name}/g, currentPdf ? currentPdf.name : 'doc')
        .replace(/{i}/g, i)
        .replace(/{start}/g, start)
        .replace(/{end}/g, end);
}

function updateFilenamePreview() {
    els.filenamePreview.textContent = generateFilename(1, 1, 5);
}

async function executeSplit() {
    if (!currentPdf) return;
    
    const parts = calculateParts();
    if (parts.length === 0) {
        showError('NO_PARTS_GENERATED', 'Check your parameters');
        return;
    }

    els.splitBtn.disabled = true;
    els.progressContainer.classList.remove('hidden');
    els.outputSection.classList.add('hidden');

    try {
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            const pct = Math.round((i / parts.length) * 100);
            
            updateProgress(pct, `Processing part ${p.index}/${parts.length}...`);
            await new Promise(r => setTimeout(r, 50));
            
            const newPdf = await PDFLib.PDFDocument.create();
            const indices = [];
            for (let n = p.start; n <= p.end; n++) indices.push(n - 1);
            
            const pages = await newPdf.copyPages(currentPdf.doc, indices);
            pages.forEach(page => newPdf.addPage(page));
            
            const bytes = await newPdf.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const fn = generateFilename(p.index, p.start, p.end);
            
            const item = document.createElement('div');
            item.className = 'download-item';
            item.innerHTML = `
                <div class="download-filename">${fn}</div>
                <div class="download-meta">Pages ${p.start}-${p.end} • ${formatBytes(blob.size)}</div>
                <a href="${url}" download="${fn}" class="download-btn">DOWNLOAD_FILE</a>
            `;
            
            if (i === 0) els.downloadList.innerHTML = '';
            els.downloadList.appendChild(item);
        }
        
        updateProgress(100, 'Complete');
        els.outputSection.classList.remove('hidden');
        els.outputSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (err) {
        showError('SPLIT_FAILED', err.message);
    } finally {
        els.splitBtn.disabled = false;
    }
}

function updateProgress(pct, txt) {
    els.progressBar.style.width = pct + '%';
    els.progressText.textContent = txt;
    els.progressPercent.textContent = pct + '%';
}

function resetAll() {
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

function formatBytes(b) {
    if (!b) return '0 B';
    const u = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    return Math.round(b / Math.pow(1024, i)) + ' ' + u[i];
}
