/**
 * Markdown Editor Web Component
 * A custom element that provides a full-featured markdown editor
 * Usage: <markdown-editor></markdown-editor>
 */

class MarkdownEditorComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.markdownEditor = null;
    }

    static get observedAttributes() {
        return ['initial-text', 'auto-detect-rtl', 'show-toolbar', 'show-controls', 'placeholder'];
    }

    connectedCallback() {
        this.render();
        this.initialize();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.markdownEditor) {
            if (name === 'initial-text') {
                this.markdownEditor.setText(newValue || '');
            } else if (name === 'auto-detect-rtl') {
                this.markdownEditor.setAutoDetectRTL(newValue === 'true');
            }
        }
    }

    render() {
        const showToolbar = this.getAttribute('show-toolbar') !== 'false';
        const showControls = this.getAttribute('show-controls') !== 'false';
        const placeholder = this.getAttribute('placeholder') || 'Type your markdown here...';

        this.shadowRoot.innerHTML = `
            ${this.getStyles()}
            <div class="editor-container">
                <div class="preview-pane">
                    <div class="pane-header">
                        <span>Preview</span>
                        <span class="direction-indicator" id="previewDirection">LTR</span>
                    </div>
                    <div id="preview" class="preview-content"></div>
                </div>

                <div class="editor-pane">
                    <div class="pane-header">
                        <span>Editor</span>
                        ${showControls ? `
                        <div class="controls">
                            <button id="toggleDirection" class="btn">↔️ Toggle RTL/LTR</button>
                            <button id="clearBtn" class="btn">🗑️ Clear</button>
                            <button id="downloadBtn" class="btn">💾 Download</button>
                        </div>
                        ` : ''}
                        <span class="direction-indicator" id="editorDirection">LTR</span>
                    </div>
                    ${showToolbar ? `
                    <div class="toolbar">
                        <button class="toolbar-btn" data-action="h1" title="Header 1">
                            <strong>H1</strong>
                        </button>
                        <button class="toolbar-btn" data-action="h2" title="Header 2">
                            <strong>H2</strong>
                        </button>
                        <button class="toolbar-btn" data-action="h3" title="Header 3">
                            <strong>H3</strong>
                        </button>
                        <span class="toolbar-divider"></span>
                        <button class="toolbar-btn" data-action="bold" title="Bold (Ctrl+B)">
                            <strong>B</strong>
                        </button>
                        <button class="toolbar-btn" data-action="italic" title="Italic (Ctrl+I)">
                            <em>I</em>
                        </button>
                        <button class="toolbar-btn" data-action="strikethrough" title="Strikethrough">
                            <del>S</del>
                        </button>
                        <span class="toolbar-divider"></span>
                        <button class="toolbar-btn" data-action="ul" title="Bullet List">
                            ☰
                        </button>
                        <button class="toolbar-btn" data-action="ol" title="Numbered List">
                            ≡
                        </button>
                        <button class="toolbar-btn" data-action="quote" title="Quote">
                            "
                        </button>
                        <span class="toolbar-divider"></span>
                        <button class="toolbar-btn" data-action="link" title="Link">
                            🔗
                        </button>
                        <button class="toolbar-btn" data-action="image" title="Image">
                            🖼️
                        </button>
                        <button class="toolbar-btn" data-action="code" title="Code">
                            &lt;/&gt;
                        </button>
                    </div>
                    ` : ''}
                    <textarea id="editor" placeholder="${placeholder}"></textarea>
                </div>
            </div>
        `;
    }

    initialize() {
        // Get elements from shadow DOM
        const editorTextarea = this.shadowRoot.getElementById('editor');
        const preview = this.shadowRoot.getElementById('preview');
        const toggleDirectionBtn = this.shadowRoot.getElementById('toggleDirection');
        const clearBtn = this.shadowRoot.getElementById('clearBtn');
        const downloadBtn = this.shadowRoot.getElementById('downloadBtn');
        const editorDirectionIndicator = this.shadowRoot.getElementById('editorDirection');
        const previewDirectionIndicator = this.shadowRoot.getElementById('previewDirection');

        // Initialize the core markdown editor
        this.markdownEditor = new MarkdownEditor({
            initialText: this.getAttribute('initial-text') || '',
            autoDetectRTL: this.getAttribute('auto-detect-rtl') !== 'false',
            onTextChange: (text, html) => {
                preview.innerHTML = html || '<p style="color: #cbd5e0;">Preview will appear here...</p>';
                this.dispatchEvent(new CustomEvent('text-change', { 
                    detail: { text, html },
                    bubbles: true,
                    composed: true
                }));
            },
            onDirectionChange: (direction) => {
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

                this.dispatchEvent(new CustomEvent('direction-change', {
                    detail: { direction },
                    bubbles: true,
                    composed: true
                }));
            }
        });

        // Event listeners
        editorTextarea.addEventListener('input', () => {
            this.markdownEditor.setText(editorTextarea.value);
        });

        // Toolbar functionality
        const toolbarButtons = this.shadowRoot.querySelectorAll('.toolbar-btn');
        toolbarButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                this.insertMarkdown(action, editorTextarea);
            });
        });

        // Control buttons
        if (toggleDirectionBtn) {
            toggleDirectionBtn.addEventListener('click', () => {
                this.markdownEditor.toggleDirection();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (editorTextarea.value && !confirm('Are you sure you want to clear the editor?')) {
                    return;
                }
                editorTextarea.value = '';
                this.markdownEditor.clear();
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadMarkdown();
            });
        }

        // Keyboard shortcuts
        editorTextarea.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.downloadMarkdown();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.markdownEditor.toggleDirection();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.insertMarkdown('bold', editorTextarea);
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.insertMarkdown('italic', editorTextarea);
            }
        });

        // Set initial text if provided
        const initialText = this.getAttribute('initial-text');
        if (initialText) {
            editorTextarea.value = initialText;
            this.markdownEditor.setText(initialText);
        }
    }

    insertMarkdown(action, editorTextarea) {
        const start = editorTextarea.selectionStart;
        const end = editorTextarea.selectionEnd;
        const selectedText = editorTextarea.value.substring(start, end);
        const beforeText = editorTextarea.value.substring(0, start);
        const afterText = editorTextarea.value.substring(end);
        
        const { newText, cursorOffset } = this.markdownEditor.insertMarkdown(action, selectedText, start);
        
        editorTextarea.value = beforeText + newText + afterText;
        editorTextarea.focus();
        editorTextarea.selectionStart = editorTextarea.selectionEnd = start + cursorOffset;
        
        this.markdownEditor.setText(editorTextarea.value);
    }

    downloadMarkdown() {
        const text = this.markdownEditor.getText();
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

    // Public API methods
    getText() {
        return this.markdownEditor ? this.markdownEditor.getText() : '';
    }

    setText(text) {
        const editorTextarea = this.shadowRoot.getElementById('editor');
        editorTextarea.value = text;
        if (this.markdownEditor) {
            this.markdownEditor.setText(text);
        }
    }

    getHTML() {
        return this.markdownEditor ? this.markdownEditor.getHTML() : '';
    }

    clear() {
        const editorTextarea = this.shadowRoot.getElementById('editor');
        editorTextarea.value = '';
        if (this.markdownEditor) {
            this.markdownEditor.clear();
        }
    }

    getStyles() {
        return `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .editor-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    height: 100%;
                    min-height: 500px;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .editor-pane,
                .preview-pane {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .preview-pane {
                    border-right: 1px solid #e2e8f0;
                }

                .pane-header {
                    background: #f7fafc;
                    padding: 12px 20px;
                    border-bottom: 2px solid #e2e8f0;
                    font-weight: 600;
                    color: #2d3748;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .pane-header .controls {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                    flex: 1;
                    justify-content: center;
                }

                .direction-indicator {
                    font-size: 12px;
                    padding: 4px 8px;
                    background: #4299e1;
                    color: white;
                    border-radius: 4px;
                    font-weight: 500;
                }

                .btn {
                    padding: 6px 12px;
                    background: #4299e1;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .btn:hover {
                    background: #3182ce;
                    transform: translateY(-1px);
                }

                .btn:active {
                    transform: translateY(0);
                }

                .toolbar {
                    display: flex;
                    gap: 4px;
                    padding: 8px 12px;
                    background: #f7fafc;
                    border-bottom: 1px solid #e2e8f0;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .toolbar-btn {
                    padding: 6px 12px;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    min-width: 36px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .toolbar-btn:hover {
                    background: #edf2f7;
                    border-color: #cbd5e0;
                }

                .toolbar-btn:active {
                    background: #e2e8f0;
                }

                .toolbar-divider {
                    width: 1px;
                    height: 24px;
                    background: #e2e8f0;
                    margin: 0 4px;
                }

                #editor {
                    flex: 1;
                    padding: 20px;
                    border: none;
                    outline: none;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 14px;
                    line-height: 1.6;
                    resize: none;
                    background: white;
                }

                #editor::placeholder {
                    color: #a0aec0;
                }

                #editor.rtl {
                    direction: rtl;
                    text-align: right;
                }

                #editor.ltr {
                    direction: ltr;
                    text-align: left;
                }

                .preview-content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #2d3748;
                }

                .preview-content.rtl {
                    direction: rtl;
                    text-align: right;
                }

                .preview-content.ltr {
                    direction: ltr;
                    text-align: left;
                }

                .preview-content h1,
                .preview-content h2,
                .preview-content h3,
                .preview-content h4,
                .preview-content h5,
                .preview-content h6 {
                    margin-top: 24px;
                    margin-bottom: 16px;
                    font-weight: 600;
                    line-height: 1.25;
                }

                .preview-content h1 { font-size: 2em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                .preview-content h2 { font-size: 1.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                .preview-content h3 { font-size: 1.25em; }
                .preview-content h4 { font-size: 1em; }
                .preview-content h5 { font-size: 0.875em; }
                .preview-content h6 { font-size: 0.85em; color: #718096; }

                .preview-content p {
                    margin-bottom: 16px;
                }

                .preview-content a {
                    color: #4299e1;
                    text-decoration: none;
                }

                .preview-content a:hover {
                    text-decoration: underline;
                }

                .preview-content code {
                    background: #f7fafc;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.9em;
                    color: #e53e3e;
                }

                .preview-content pre {
                    background: #2d3748;
                    color: #f7fafc;
                    padding: 16px;
                    border-radius: 6px;
                    overflow-x: auto;
                    margin-bottom: 16px;
                }

                .preview-content pre code {
                    background: none;
                    color: inherit;
                    padding: 0;
                }

                .preview-content blockquote {
                    border-left: 4px solid #4299e1;
                    padding-left: 16px;
                    color: #718096;
                    font-style: italic;
                    margin: 16px 0;
                }

                .preview-content ul,
                .preview-content ol {
                    margin-bottom: 16px;
                    padding-left: 32px;
                }

                .preview-content li {
                    margin-bottom: 8px;
                }

                .preview-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 6px;
                    margin: 16px 0;
                }

                .preview-content hr {
                    border: none;
                    border-top: 2px solid #e2e8f0;
                    margin: 24px 0;
                }

                @media (max-width: 768px) {
                    .editor-container {
                        grid-template-columns: 1fr;
                        grid-template-rows: 1fr 1fr;
                    }

                    .preview-pane {
                        border-right: none;
                        border-bottom: 1px solid #e2e8f0;
                    }
                }
            </style>
        `;
    }
}

// Register the custom element
customElements.define('markdown-editor', MarkdownEditorComponent);
