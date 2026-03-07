// State
let currentFile = null;
let pdfDoc = null;
let totalPages = 0;
let currentMode = 'equal';
let generatedPdfs = [];

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const infoStrip = document.getElementById('infoStrip');
const fileNameEl = document.getElementById('fileName');
const pageCountEl = document.getElementById('pageCount');
const controlPanel = document.getElementById('controlPanel');
const modeBtns = document.querySelectorAll('.mode-btn');
const equalMode = document.getElementById('equalMode');
const rangesMode = document.getElementById('rangesMode');
const partsInput = document.getElementById('partsInput');
const minusBtn = document.getElementById('minusBtn');
const plusBtn = document.getElementById('plusBtn');
const rangeInput = document.getElementById('rangeInput');
const rangeError = document.getElementById('rangeError');
const previewPanel = document.getElementById('previewPanel');
const previewList = document.getElementById('previewList');
const splitBtn = document.getElementById('splitBtn');
const progressPanel = document.getElementById('progressPanel');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsPanel = document.getElementById('resultsPanel');
const resultsList = document.getElementById('resultsList');
const errorToast = document.getElementById('errorToast');
const errorText = document.getElementById('errorText');

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

minusBtn.addEventListener('click', () => updateParts(-1));
plusBtn.addEventListener('click', () => updateParts(1));
partsInput.addEventListener('change', validatePartsInput);

rangeInput.addEventListener('input', () => {
    rangeError.classList.add('hidden');
    updatePreview();
});

splitBtn.addEventListener('click', handleSplit);

// Drag & Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
    
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            processFile(file);
        } else {
            showError('Bitte eine PDF-Datei hochladen (.' + file.name.split('.').pop() + ' ist keine PDF)');
        }
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

// File Processing
async function processFile(file) {
    try {
        currentFile = file;
        const arrayBuffer = await file.arrayBuffer();
        
        // Prüfe ob PDF-lib geladen ist
        if (typeof PDFLib === 'undefined') {
            showError('PDF-Library wird geladen... Bitte warte einen Moment und versuche es erneut.');
            return;
        }
        
        pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        totalPages = pdfDoc.getPageCount();
        
        // Update UI
        fileNameEl.textContent = file.name;
        pageCountEl.textContent = totalPages;
        infoStrip.style.display = window.innerWidth <= 600 ? 'flex' : 'grid';
        infoStrip.style.flexDirection = 'column';
        controlPanel.style.display = 'block';
        previewPanel.style.display = 'block';
        splitBtn.style.display = 'flex';
        resultsPanel.classList.add('hidden');
        
        updatePreview();
    } catch (err) {
        showError('Fehler beim Laden der PDF: ' + err.message);
        console.error(err);
    }
}

// Mode Switching
function switchMode(mode) {
    currentMode = mode;
    modeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    if (mode === 'equal') {
        equalMode.classList.remove('hidden');
        rangesMode.classList.add('hidden');
    } else {
        equalMode.classList.add('hidden');
        rangesMode.classList.remove('hidden');
    }
    
    updatePreview();
}

// Parts Input
function updateParts(delta) {
    let val = parseInt(partsInput.value) + delta;
    val = Math.max(2, Math.min(50, val));
    partsInput.value = val;
    updatePreview();
}

function validatePartsInput() {
    let val = parseInt(partsInput.value);
    if (isNaN(val) || val < 2) val = 2;
    if (val > 50) val = 50;
    if (val > totalPages && totalPages > 0) val = totalPages;
    partsInput.value = val;
    updatePreview();
}

// Preview Generation
function updatePreview() {
    previewList.innerHTML = '';
    const splits = calculateSplits();
    
    if (splits.length === 0) return;
    
    splits.forEach((split, index) => {
        const li = document.createElement('li');
        li.className = 'preview-item';
        
        const baseName = currentFile ? currentFile.name.replace('.pdf', '') : 'dokument';
        li.innerHTML = `
            <span class="preview-name">${baseName}_teil${index + 1}.pdf</span>
            <span class="preview-range">${split.start}-${split.end}</span>
        `;
        previewList.appendChild(li);
    });
}

function calculateSplits() {
    if (!totalPages) return [];
    
    if (currentMode === 'equal') {
        const parts = parseInt(partsInput.value) || 2;
        const splits = [];
        const pagesPerPart = Math.floor(totalPages / parts);
        const remainder = totalPages % parts;
        
        let currentPage = 1;
        for (let i = 0; i < parts; i++) {
            const extra = i < remainder ? 1 : 0;
            const size = pagesPerPart + extra;
            const end = Math.min(currentPage + size - 1, totalPages);
            if (currentPage <= totalPages) {
                splits.push({ start: currentPage, end: end });
            }
            currentPage = end + 1;
        }
        return splits;
    } else {
        const rangeStr = rangeInput.value.trim();
        if (!rangeStr) return [];
        
        const ranges = parseRanges(rangeStr);
        if (!ranges) {
            rangeError.classList.remove('hidden');
            return [];
        }
        rangeError.classList.add('hidden');
        
        return ranges.map(r => ({ start: r.start, end: r.end }));
    }
}

function parseRanges(str) {
    const ranges = [];
    const parts = str.split(',');
    
    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        
        // Unterstützt sowohl "1-5" als auch "1 - 5"
        const match = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
        if (!match) return null;
        
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        
        if (start > end || start < 1 || end > totalPages) return null;
        if (start > totalPages) return null;
        
        ranges.push({ start, end });
    }
    
    return ranges.length > 0 ? ranges : null;
}

// Split Handler
async function handleSplit() {
    const splits = calculateSplits();
    if (splits.length === 0) {
        showError('Keine gültigen Bereiche definiert');
        return;
    }
    
    // Prüfe ob PDF-lib verfügbar
    if (typeof PDFLib === 'undefined') {
        showError('PDF-Library nicht geladen. Seite neu laden bitte.');
        return;
    }
    
    // Show progress
    splitBtn.style.display = 'none';
    previewPanel.style.display = 'none';
    controlPanel.style.display = 'none';
    infoStrip.style.display = 'none';
    progressPanel.classList.remove('hidden');
    
    generatedPdfs = [];
    
    try {
        for (let i = 0; i < splits.length; i++) {
            const split = splits[i];
            
            // Update progress
            const percent = ((i + 1) / splits.length) * 100;
            progressFill.style.width = percent + '%';
            progressText.textContent = `Teil ${i + 1}/${splits.length}`;
            
            // Create new PDF
            const newPdf = await PDFLib.PDFDocument.create();
            const pageIndices = Array.from(
                {length: split.end - split.start + 1}, 
                (_, j) => split.start - 1 + j
            );
            
            const pages = await newPdf.copyPages(pdfDoc, pageIndices);
            pages.forEach(page => newPdf.addPage(page));
            
            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            
            const baseName = currentFile ? currentFile.name.replace('.pdf', '') : 'dokument';
            generatedPdfs.push({
                name: `${baseName}_teil${i + 1}.pdf`,
                blob: blob,
                size: blob.size,
                pages: split.end - split.start + 1
            });
            
            // Delay für UI Update
            await new Promise(r => setTimeout(r, 50));
        }
        
        // Show results
        progressPanel.classList.add('hidden');
        showResults();
        
    } catch (err) {
        progressPanel.classList.add('hidden');
        showError('Fehler beim Splitten: ' + err.message);
        console.error(err);
        
        // UI zurücksetzen
        controlPanel.style.display = 'block';
        previewPanel.style.display = 'block';
        splitBtn.style.display = 'flex';
    }
}

function showResults() {
    resultsList.innerHTML = '';
    
    generatedPdfs.forEach((pdf, index) => {
        const li = document.createElement('li');
        li.className = 'result-item';
        li.innerHTML = `
            <div class="result-info">
                <div class="result-name">${pdf.name}</div>
                <div class="result-meta">${pdf.pages} Seiten • ${formatBytes(pdf.size)}</div>
            </div>
            <button class="download-btn" data-index="${index}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download
            </button>
        `;
        resultsList.appendChild(li);
    });
    
    // Download handlers
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('click', handleDownload);
    });
    
    resultsPanel.classList.remove('hidden');
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleDownload(e) {
    const btn = e.currentTarget;
    const index = parseInt(btn.dataset.index);
    const pdf = generatedPdfs[index];
    
    if (!pdf || !pdf.blob) {
        showError('Download nicht verfügbar');
        return;
    }
    
    // Native Download via Anchor
    const url = URL.createObjectURL(pdf.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdf.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    // Visual feedback
    btn.innerHTML = '✓ Gespeichert';
    btn.style.background = 'var(--green)';
    setTimeout(() => {
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download
        `;
        btn.style.background = '';
    }, 2000);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Error Handling
function showError(msg) {
    errorText.textContent = msg;
    errorToast.classList.remove('hidden');
    
    // Auto-hide nach 4 Sekunden
    setTimeout(() => {
        errorToast.classList.add('hidden');
    }, 4000);
    
    // Click to dismiss
    errorToast.onclick = () => {
        errorToast.classList.add('hidden');
    };
}

// Responsive Info-Strip Fix
window.addEventListener('resize', () => {
    if (infoStrip.style.display !== 'none') {
        if (window.innerWidth <= 600) {
            infoStrip.style.display = 'flex';
            infoStrip.style.flexDirection = 'column';
        } else {
            infoStrip.style.display = 'grid';
            infoStrip.style.flexDirection = '';
        }
    }
});
