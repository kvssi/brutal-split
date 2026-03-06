/**
 * BRUTAL SPLIT - Application Logic
 * Handles PDF loading, splitting logic, UI updates, and downloads.
 */

// --- Constants ---
const APP_NAME = "BRUTAL SPLIT";
const PDF_LIB_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";

// --- State ---
let currentPdf = null; // { bytes, name, doc, pageCount }
let splitMode = 'equal'; // 'equal' | 'custom'
let generatedParts = []; // Array of { blob, filename, range }

// --- DOM Elements ---
const els = {
    uploadSection: document.getElementById('upload-section'),
    configSection: document.getElementById('config-section'),
    fileInput: document.getElementById('file-input'),
    dropContent: document.getElementById('drop-content'),
    fileName: document.getElementById('file-name'),
    fileSize: document.getElementById('file-size'),
    totalPages: document.getElementById('total-pages'),
    partsCount: document.getElementById('parts-count'),
    previewBody: document.getElementById('preview-body'),
    splitBtn: document.getElementById('split-btn'),
    resetBtn: document.getElementById('reset-btn'),
    progressContainer: document.getElementById('progress-container'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent'),
    outputSection: document.getElementById('output-section'),
    downloadList: document.getElementById('download-list'),
    modeBtns: document.querySelectorAll('.mode-btn'),
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
    offlineBadge: document.getElementById('offline-badge')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initServiceWorker();
    setupEventListeners();
    updateFilenamePreview();
});

// --- Service Worker ---
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('SW registered');
                els.offlineBadge.classList.remove('hidden');
                setTimeout(() => els.offlineBadge.classList.add('hidden'), 5000);
            })
            .catch(err => console.error('SW registration failed:', err));
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // Drag & Drop
    els.uploadSection.addEventListener('click', () => els.fileInput.click());
    els.uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.uploadSection.classList.add('drag-over');
    });
    els.uploadSection.addEventListener('dragleave', () => {
        els.uploadSection.classList.remove('drag-over');
    });
    els.uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        els.uploadSection.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });
    els.fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    // Mode Toggle
    els.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            splitMode = btn.dataset.mode;
            if (splitMode === 'equal') {
                els.equalControls.classList.remove('hidden');
                els.customControls.classList.add('hidden');
            } else {
                els.equalControls.classList.add('hidden');
                els.customControls.classList.remove('hidden');
            }
            updatePreview();
        });
    });

    // Inputs
    els.partsCount.addEventListener('input', updatePreview);
    els.customRanges.addEventListener('input', updatePreview);
    els.namingTemplate.addEventListener('input', updateFilenamePreview);

    // Actions
    els.splitBtn.addEventListener('click', startSplit);
    els.resetBtn.addEventListener('click', resetApp);
    els.errorClose.addEventListener('click', () => els.errorPanel.classList.add('hidden'));
}

// --- File Handling ---
async function handleFile(file) {
    if (file.type !== 'application/pdf') {
        showError('Nur PDF-Dateien erlaubt.', 'Invalid MIME type: ' + file.type);
        return;
    }

    try {
        setLoading(true);
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(bytes);
        const pageCount = pdfDoc.getPageCount();

        currentPdf = {
            bytes,
            name: file.name.replace('.pdf', ''),
            doc: pdfDoc,
            pageCount
        };

        // Update UI
        els.fileName.textContent = file.name;
        els.fileSize.textContent = formatBytes(file.size);
        els.totalPages.textContent = pageCount;
        els.partsCount.max = pageCount;
        
        // Transition
        els.uploadSection.classList.add('hidden');
        els.configSection.classList.remove('hidden');
        
        updatePreview();
        setLoading(false);
    } catch (err) {
        setLoading(false);
        showError('Fehler beim Laden der PDF.', err.message);
    }
}

// --- Logic: Preview Generation ---
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
        if (count < 1) count = 1;
        if (count > total) count = total;
        
        // Distribute as evenly as possible (algorithm: remainder gets +1)
        const baseSize = Math.floor(total / count);
        const remainder = total % count;
        
        let currentPage = 1;
        for (let i = 0; i < count; i++) {
            const size = baseSize + (i < remainder ? 1 : 0);
            const start = currentPage;
            const end = currentPage + size - 1;
            parts.push({ start, end, index: i + 1 });
            currentPage += size;
        }
    } else {
        // Custom Range Parsing
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

        if (!valid && input.length > 0) {
            els.rangeError.classList.remove('hidden');
            return [];
        } else {
            els.rangeError.classList.add('hidden');
        }
    }
    
    return parts;
}

function renderPreviewTable(parts) {
    els.previewBody.innerHTML = '';
    
    if (parts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align:center;color:#999;">Keine gültigen Bereiche</td>';
        els.previewBody.appendChild(row);
        return;
    }

    parts.forEach(part => {
        const row = document.createElement('tr');
        const filename = generateFilename(part.index, part.start, part.end);
        row.innerHTML = `
            <td>${part.index}</td>
            <td class="truncate" style="max-width:200px" title="${filename}">${filename}</td>
            <td>${part.start}–${part.end}</td>
            <td>${part.end - part.start + 1}</td>
        `;
        els.previewBody.appendChild(row);
    });
}

// --- Smart Feature: Naming Template ---
function generateFilename(index, start, end) {
    let template = els.namingTemplate.value || '{name}_part_{i}_pages_{start}-{end}.pdf';
    const name = currentPdf ? currentPdf.name : 'document';
    
    return template
        .replace(/{name}/g, name)
        .replace(/{i}/g, index)
        .replace(/{start}/g, start)
        .replace(/{end}/g, end);
}

function updateFilenamePreview() {
    const preview = generateFilename(1, 1, 5);
    els.filenamePreview.textContent = preview;
}

// --- Core: Splitting Logic ---
async function startSplit() {
    if (!currentPdf) return;
    
    const parts = calculateParts();
    if (parts.length === 0) {
        showError('Keine gültigen Teile zum Splitten.', 'Preview calculation returned empty array.');
        return;
    }

    // UI State
    els.splitBtn.disabled = true;
    els.splitBtn.textContent = 'Verarbeite...';
    els.progressContainer.classList.remove('hidden');
    els.outputSection.classList.add('hidden');
    generatedParts = [];

    try {
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            
            // Update Progress
            const percent = Math.round(((i) / parts.length) * 100);
            updateProgress(percent, `Erstelle Teil ${i + 1}/${parts.length}...`);
            
            // Yield to event loop to keep UI responsive
            await new Promise(r => setTimeout(r, 0));
            
            // Create new PDF with specific pages
            // Note: pdf-lib uses 0-based indices for copyPages
            const newPdf = await PDFLib.PDFDocument.create();
            const pageIndices = [];
            for (let p = part.start; p <= part.end; p++) {
                pageIndices.push(p - 1);
            }
            
            const copiedPages = await newPdf.copyPages(currentPdf.doc, pageIndices);
            copiedPages.forEach(page => newPdf.addPage(page));
            
            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const filename = generateFilename(part.index, part.start, part.end);
            
            generatedParts.push({ blob, filename, range: `${part.start}-${part.end}` });
        }
        
        updateProgress(100, 'Fertig!');
        showResults();
        
    } catch (err) {
        showError('Fehler beim Splitten.', err.message);
    } finally {
        els.splitBtn.disabled = false;
        els.splitBtn.textContent = 'Split & Download';
        setTimeout(() => els.progressContainer.classList.add('hidden'), 1000);
    }
}

function updateProgress(percent, text) {
    els.progressBar.style.width = percent + '%';
    els.progressPercent.textContent = percent + '%';
    els.progressText.textContent = text;
}

function showResults() {
    els.outputSection.classList.remove('hidden');
    els.downloadList.innerHTML = '';
    
    generatedParts.forEach((part, idx) => {
        const url = URL.createObjectURL(part.blob);
        const item = document.createElement('div');
        item.className = 'download-item';
        item.innerHTML = `
            <div class="download-filename">${part.filename}</div>
            <div class="download-meta">Seiten ${part.range} • ${formatBytes(part.blob.size)}</div>
            <a href="${url}" download="${part.filename}" class="download-btn">Download</a>
        `;
        els.downloadList.appendChild(item);
    });
    
    // Scroll to results
    els.outputSection.scrollIntoView({ behavior: 'smooth' });
}

// --- Utilities ---
function resetApp() {
    currentPdf = null;
    generatedParts = [];
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
    els.errorTech.textContent = tech || '';
    els.errorPanel.classList.remove('hidden');
    els.errorPanel.scrollIntoView({ behavior: 'smooth' });
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function setLoading(isLoading) {
    els.dropContent.style.opacity = isLoading ? '0.5' : '1';
    els.uploadSection.style.pointerEvents = isLoading ? 'none' : 'auto';
}
