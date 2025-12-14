/**
 * Application Layer - UI Controls and DOM Integration
 * Wraps the core MarkdownEditor with application-specific features
 */

// Get DOM elements
const editorTextarea = document.getElementById('editor');
const preview = document.getElementById('preview');
const toggleDirectionBtn = document.getElementById('toggleDirection');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const autoDetectRTL = document.getElementById('autoDetectRTL');
const editorDirectionIndicator = document.getElementById('editorDirection');
const previewDirectionIndicator = document.getElementById('previewDirection');

// Initialize the core markdown editor
const markdownEditor = new MarkdownEditor({
    initialText: '',
    autoDetectRTL: true,
    onTextChange: (text, html) => {
        // Update preview HTML
        preview.innerHTML = html || '<p style="color: #cbd5e0;">Preview will appear here...</p>';
    },
    onDirectionChange: (direction) => {
        // Update UI direction indicators and classes
        const isRTL = direction === 'rtl';
        
        if (isRTL) {
            editorTextarea.classList.add('rtl');
            editorTextarea.classList.remove('ltr');
            preview.classList.add('rtl');
            preview.classList.remove('ltr');
            editorDirectionIndicator.textContent = 'RTL';
            previewDirectionIndicator.textContent = 'RTL';
        } else {
            editorTextarea.classList.add('ltr');
            editorTextarea.classList.remove('rtl');
            preview.classList.add('ltr');
            preview.classList.remove('rtl');
            editorDirectionIndicator.textContent = 'LTR';
            previewDirectionIndicator.textContent = 'LTR';
        }
    }
});

// Update preview
function updatePreview() {
    markdownEditor.setText(editorTextarea.value);
}

// Toggle direction manually
function toggleDirection() {
    markdownEditor.toggleDirection();
}

// Clear editor
function clearEditor() {
    if (editorTextarea.value && !confirm('Are you sure you want to clear the editor?')) {
        return;
    }
    editorTextarea.value = '';
    markdownEditor.clear();
}

// Download markdown file
function downloadMarkdown() {
    const text = markdownEditor.getText();
    if (!text.trim()) {
        alert('Nothing to download!');
        return;
    }

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Load from localStorage on page load
function loadFromStorage() {
    const saved = localStorage.getItem('markdown-editor-content');
    if (saved) {
        editorTextarea.value = saved;
        updatePreview();
    }
}

// Save to localStorage
function saveToStorage() {
    localStorage.setItem('markdown-editor-content', editorTextarea.value);
}

// Event listeners
editorTextarea.addEventListener('input', () => {
    updatePreview();
    saveToStorage();
});

// Toolbar functionality
function insertMarkdown(action) {
    const start = editorTextarea.selectionStart;
    const end = editorTextarea.selectionEnd;
    const selectedText = editorTextarea.value.substring(start, end);
    const beforeText = editorTextarea.value.substring(0, start);
    const afterText = editorTextarea.value.substring(end);
    
    const { newText, cursorOffset } = markdownEditor.insertMarkdown(action, selectedText, start);
    
    editorTextarea.value = beforeText + newText + afterText;
    editorTextarea.focus();
    editorTextarea.selectionStart = editorTextarea.selectionEnd = start + cursorOffset;
    
    updatePreview();
    saveToStorage();
}

// Add toolbar button listeners
document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        insertMarkdown(action);
    });
});

toggleDirectionBtn.addEventListener('click', toggleDirection);
clearBtn.addEventListener('click', clearEditor);
downloadBtn.addEventListener('click', downloadMarkdown);

autoDetectRTL.addEventListener('change', () => {
    markdownEditor.setAutoDetectRTL(autoDetectRTL.checked);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S or Cmd+S to download
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        downloadMarkdown();
    }
    
    // Ctrl+D or Cmd+D to toggle direction
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleDirection();
    }
    
    // Ctrl+B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        insertMarkdown('bold');
    }
    
    // Ctrl+I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        insertMarkdown('italic');
    }
});

// Initialize
loadFromStorage();
updatePreview();
