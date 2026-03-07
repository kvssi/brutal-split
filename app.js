const els = {
    fileInput: document.getElementById('file-input'),
    dropZone: document.getElementById('drop-zone'),
    uploadSection: document.getElementById('upload-section'),
    configSection: document.getElementById('config-section'),
    fileName: document.getElementById('file-name'),
    totalPages: document.getElementById('total-pages'),
    modeBtns: document.querySelectorAll('.mode-btn'),
    equalControls: document.getElementById('equal-controls'),
    customControls: document.getElementById('custom-controls'),
    partsCount: document.getElementById('parts-count'),
    decParts: document.getElementById('dec-parts'),
    incParts: document.getElementById('inc-parts'),
    customRanges: document.getElementById('custom-ranges'),
    rangeError: document.getElementById('range-error'),
    previewList: document.getElementById('preview-list'),
    splitBtn: document.getElementById('split-btn'),
    progressContainer: document.getElementById('progress-container'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    outputSection: document.getElementById('output-section'),
    downloadList: document.getElementById('download-list'),
    errorPanel: document.getElementById('error-panel'),
    errorMessage: document.getElementById('error-message')
};

let currentPdf = null;
let splitMode = 'equal';

document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js');
    }
    bindEvents();
    updatePreview();
});

function bindEvents() {
    els.dropZone.addEventListener('click', () => els.fileInput.click());
    els.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.dropZone.querySelector('.upload-box').style.background = '#ffff00';
    });
    els.dropZone.addEventListener('dragleave', () => {
        els.dropZone.querySelector('.upload-box').style.background = '';
    });
    els.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        els.dropZone.querySelector('.upload-box').style.background = '';
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    els.fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });

    els.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            els.modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            splitMode = btn.dataset.mode;
            els.equalControls.classList.toggle('hidden', splitMode !== 'equal');
            els.customControls.classList.toggle('hidden', splitMode !== 'custom');
            updatePreview();
        });
    });

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

    els.splitBtn.addEventListener('click', startSplit);
}

async function handleFile(file) {
    if (file.type !== 'application/pdf') {
        showError('Nur PDF Dateien');
        return;
    }

    try {
        const bytes = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(bytes);
        
        currentPdf = {
            bytes,
            name: file.name.replace('.pdf', ''),
            doc: pdfDoc,
            pageCount: pdfDoc.getPageCount()
        };

        els.fileName.textContent = file.name;
        els.totalPages.textContent = currentPdf.pageCount;

        els.uploadSection.classList.add('hidden');
        els.configSection.classList.remove('hidden');
        
        updatePreview();
    } catch (err) {
        showError('Fehler beim Laden');
    }
}

function updatePreview() {
    if (!currentPdf) return;
    const parts = calculateParts();
    renderPreview(parts);
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

function renderPreview(parts) {
    els.previewList.innerHTML = '';
    
    if (parts.length === 0) {
        els.previewList.innerHTML = '<div class="preview-placeholder">Warte auf Eingabe...</div>';
        return;
    }

    parts.forEach(p => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <span class="preview-name">${currentPdf.name}_teil${p.index}.pdf</span>
            <span class="preview-range">${p.start}-${p.end}</span>
        `;
        els.previewList.appendChild(item);
    });
}

async function startSplit() {
    if (!currentPdf) return;
    
    const parts = calculateParts();
    if (parts.length === 0) {
        showError('Keine gültigen Teile');
        return;
    }

    els.splitBtn.disabled = true;
    els.progressContainer.classList.remove('hidden');
    els.outputSection.classList.add('hidden');

    try {
        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            const pct = Math.round((i / parts.length) * 100);
            
            updateProgress(pct, `Teil ${p.index}/${parts.length}`);
            await new Promise(r => setTimeout(r, 50));
            
            const newPdf = await PDFLib.PDFDocument.create();
            const indices = [];
            for (let n = p.start; n <= p.end; n++) indices.push(n - 1);
            
            const pages = await newPdf.copyPages(currentPdf.doc, indices);
            pages.forEach(page => newPdf.addPage(page));
            
            const bytes = await newPdf.save();
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-info">
                    <div class="result-name">${currentPdf.name}_teil${p.index}.pdf</div>
                    <div class="result-meta">Seiten ${p.start}-${p.end}</div>
                </div>
                <a href="${url}" download="${currentPdf.name}_teil${p.index}.pdf" class="result-btn">↓</a>
            `;
            
            if (i === 0) els.downloadList.innerHTML = '';
            els.downloadList.appendChild(item);
        }
        
        updateProgress(100, 'Fertig');
        els.outputSection.classList.remove('hidden');
        
    } catch (err) {
        showError('Fehler beim Splitten');
    } finally {
        els.splitBtn.disabled = false;
    }
}

function updateProgress(pct, txt) {
    els.progressBar.style.width = pct + '%';
    els.progressText.textContent = txt;
}

function showError(msg) {
    els.errorMessage.textContent = msg;
    els.errorPanel.classList.remove('hidden');
    setTimeout(() => els.errorPanel.classList.add('hidden'), 3000);
}
