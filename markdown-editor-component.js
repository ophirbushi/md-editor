/**
 * MarkdownEditor - Core markdown editing and parsing functionality
 * Independent of DOM and application-specific features
 */
class MarkdownEditor {
    constructor(options = {}) {
        this.text = options.initialText || '';
        this.direction = options.defaultDirection || 'rtl'; // 'ltr' or 'rtl', default is rtl
        this.autoDetectRTL = options.autoDetectRTL !== undefined ? options.autoDetectRTL : true;
        this.manualDirection = null; // null = auto, 'ltr' or 'rtl' = manual override
        
        // Callbacks
        this.onTextChange = options.onTextChange || (() => {});
        this.onDirectionChange = options.onDirectionChange || (() => {});
        
        // Trigger initial direction callback
        if (this.onDirectionChange) {
            this.onDirectionChange(this.direction);
        }
    }

    /**
     * RTL detection - checks if text contains Hebrew, Arabic, or other RTL characters
     */
    containsRTL(text) {
        const rtlChars = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        return rtlChars.test(text);
    }

    /**
     * Parse markdown text to HTML
     */
    parseMarkdown(text) {
        // Process images and links BEFORE escaping HTML (they use < > characters)
        // Images
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '___IMAGE___$2___ALT___$1___IMAGEEND___');
        
        // Links
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '___LINK___$2___TEXT___$1___LINKEND___');

        // Escape HTML
        text = text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');

        // Restore images and links with proper HTML
        text = text.replace(/___IMAGE___([^_]+)___ALT___([^_]*)___IMAGEEND___/g, '<img src="$1" alt="$2">');
        text = text.replace(/___LINK___([^_]+)___TEXT___([^_]+)___LINKEND___/g, '<a href="$1" target="_blank">$2</a>');

        // Headers
        text = text.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
        text = text.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        text = text.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

        // Italic
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/_(.+?)_/g, '<em>$1</em>');

        // Strikethrough
        text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Code blocks
        text = text.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');

        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Blockquotes
        text = text.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

        // Horizontal rules
        text = text.replace(/^---$/gim, '<hr>');
        text = text.replace(/^\*\*\*$/gim, '<hr>');

        // Lists
        const lines = text.split('\n');
        let inList = false;
        let inOrderedList = false;
        let result = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Unordered list
            if (line.match(/^[\*\-\+] /)) {
                if (!inList) {
                    result.push('<ul>');
                    inList = true;
                }
                result.push('<li>' + line.replace(/^[\*\-\+] /, '') + '</li>');
            }
            // Ordered list
            else if (line.match(/^\d+\. /)) {
                if (!inOrderedList) {
                    result.push('<ol>');
                    inOrderedList = true;
                }
                result.push('<li>' + line.replace(/^\d+\. /, '') + '</li>');
            }
            // Not a list item
            else {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                }
                result.push(line);
            }
        }

        // Close any open lists
        if (inList) result.push('</ul>');
        if (inOrderedList) result.push('</ol>');

        text = result.join('\n');

        // Paragraphs (simple approach)
        text = text.replace(/\n\n/g, '</p><p>');
        text = '<p>' + text + '</p>';

        // Clean up empty paragraphs
        text = text.replace(/<p><\/p>/g, '');
        text = text.replace(/<p>(<h[1-6]>)/g, '$1');
        text = text.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        text = text.replace(/<p>(<ul>)/g, '$1');
        text = text.replace(/(<\/ul>)<\/p>/g, '$1');
        text = text.replace(/<p>(<ol>)/g, '$1');
        text = text.replace(/(<\/ol>)<\/p>/g, '$1');
        text = text.replace(/<p>(<blockquote>)/g, '$1');
        text = text.replace(/(<\/blockquote>)<\/p>/g, '$1');
        text = text.replace(/<p>(<pre>)/g, '$1');
        text = text.replace(/(<\/pre>)<\/p>/g, '$1');
        text = text.replace(/<p>(<hr>)<\/p>/g, '$1');

        return text;
    }

    /**
     * Update the editor text
     */
    setText(text) {
        this.text = text;
        this.updateDirection();
        this.onTextChange(text, this.getHTML());
    }

    /**
     * Get current text
     */
    getText() {
        return this.text;
    }

    /**
     * Get HTML output
     */
    getHTML() {
        return this.parseMarkdown(this.text);
    }

    /**
     * Get current direction
     */
    getDirection() {
        return this.direction;
    }

    /**
     * Update text direction based on auto-detect or manual setting
     */
    updateDirection() {
        let isRTL = false;

        if (this.autoDetectRTL && this.manualDirection === null) {
            // Auto-detect mode
            if (this.text && this.text.trim()) {
                // If there's text, detect based on content
                isRTL = this.containsRTL(this.text);
            } else {
                // If no text, use the default direction set in constructor
                isRTL = this.direction === 'rtl';
            }
        } else if (this.manualDirection !== null) {
            // Manual mode
            isRTL = this.manualDirection === 'rtl';
        } else {
            // Fallback to current direction
            isRTL = this.direction === 'rtl';
        }

        const newDirection = isRTL ? 'rtl' : 'ltr';
        
        if (newDirection !== this.direction) {
            this.direction = newDirection;
            this.onDirectionChange(newDirection);
        }
    }

    /**
     * Toggle direction manually
     */
    toggleDirection() {
        const currentIsRTL = this.direction === 'rtl';
        this.manualDirection = currentIsRTL ? 'ltr' : 'rtl';
        this.autoDetectRTL = false;
        this.updateDirection();
    }

    /**
     * Set auto-detect RTL mode
     */
    setAutoDetectRTL(enabled) {
        this.autoDetectRTL = enabled;
        if (enabled) {
            this.manualDirection = null;
            this.updateDirection();
        }
    }

    /**
     * Insert markdown syntax at a specific position
     */
    insertMarkdown(action, selectedText = '', position = 0) {
        let newText = '';
        let cursorOffset = 0;
        
        switch(action) {
            case 'h1':
                newText = selectedText ? `# ${selectedText}` : '# ';
                cursorOffset = newText.length;
                break;
            case 'h2':
                newText = selectedText ? `## ${selectedText}` : '## ';
                cursorOffset = newText.length;
                break;
            case 'h3':
                newText = selectedText ? `### ${selectedText}` : '### ';
                cursorOffset = newText.length;
                break;
            case 'bold':
                newText = selectedText ? `**${selectedText}**` : '****';
                cursorOffset = selectedText ? newText.length : 2;
                break;
            case 'italic':
                newText = selectedText ? `*${selectedText}*` : '**';
                cursorOffset = selectedText ? newText.length : 1;
                break;
            case 'strikethrough':
                newText = selectedText ? `~~${selectedText}~~` : '~~~~';
                cursorOffset = selectedText ? newText.length : 2;
                break;
            case 'ul':
                newText = selectedText ? `- ${selectedText}` : '- ';
                cursorOffset = newText.length;
                break;
            case 'ol':
                newText = selectedText ? `1. ${selectedText}` : '1. ';
                cursorOffset = newText.length;
                break;
            case 'quote':
                newText = selectedText ? `> ${selectedText}` : '> ';
                cursorOffset = newText.length;
                break;
            case 'link':
                newText = selectedText ? `[${selectedText}](url)` : '[](url)';
                cursorOffset = selectedText ? newText.length - 4 : 1;
                break;
            case 'image':
                newText = selectedText ? `![${selectedText}](image-url)` : '![](image-url)';
                cursorOffset = selectedText ? newText.length - 11 : 2;
                break;
            case 'code':
                newText = selectedText ? `\`${selectedText}\`` : '``';
                cursorOffset = selectedText ? newText.length : 1;
                break;
        }
        
        return { newText, cursorOffset };
    }

    /**
     * Clear all text
     */
    clear() {
        this.text = '';
        this.manualDirection = null;
        this.onTextChange('', '');
    }
}

/**
 * Markdown Editor Web Component
 * A custom element that provides a full-featured markdown editor
 * Usage: <markdown-editor></markdown-editor>
 */

class MarkdownEditorComponent extends HTMLElement {
    constructor() {
        super();
        this._shadowRoot = this.attachShadow({ mode: 'closed' });
        this.markdownEditor = null;
    }

    static get observedAttributes() {
        return ['initial-text', 'auto-detect-rtl', 'show-toolbar', 'show-controls', 'placeholder', 'default-direction'];
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
            } else if (name === 'default-direction') {
                this.markdownEditor.direction = newValue === 'ltr' ? 'ltr' : 'rtl';
                this.markdownEditor.updateDirection();
            }
        }
    }

    render() {
        const showToolbar = this.getAttribute('show-toolbar') === 'true';
        const showControls = this.getAttribute('show-controls') !== 'false';
        const placeholder = this.getAttribute('placeholder') || 'הקלד את הטקסט שלך כאן...';

        this._shadowRoot.innerHTML = `
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
                            <button id="toggleToolbarBtn" class="btn" title="Toggle Toolbar">🔧 Toolbar</button>
                            <button id="toggleDirection" class="btn">↔️ Toggle RTL/LTR</button>
                            <button id="clearBtn" class="btn">🗑️ Clear</button>
                            <button id="downloadBtn" class="btn">💾 Download</button>
                        </div>
                        ` : ''}
                        <span class="direction-indicator" id="editorDirection">LTR</span>
                    </div>
                    <div class="toolbar" id="toolbar" style="display: ${showToolbar ? 'flex' : 'none'}">
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
                    <div class="editor-wrapper">
                        <div id="editorHighlight" class="editor-highlight"></div>
                        <textarea id="editor" placeholder="${placeholder}"></textarea>
                    </div>
                </div>
            </div>
        `;
    }

    initialize() {
        // Get elements from shadow DOM
        const editorTextarea = this._shadowRoot.getElementById('editor');
        const editorHighlight = this._shadowRoot.getElementById('editorHighlight');
        const preview = this._shadowRoot.getElementById('preview');
        const toggleDirectionBtn = this._shadowRoot.getElementById('toggleDirection');
        const clearBtn = this._shadowRoot.getElementById('clearBtn');
        const downloadBtn = this._shadowRoot.getElementById('downloadBtn');
        const toggleToolbarBtn = this._shadowRoot.getElementById('toggleToolbarBtn');
        const toolbar = this._shadowRoot.getElementById('toolbar');
        const editorDirectionIndicator = this._shadowRoot.getElementById('editorDirection');
        const previewDirectionIndicator = this._shadowRoot.getElementById('previewDirection');

        // Syntax highlighting helper
        const updateHighlight = () => {
            let text = editorTextarea.value;
            
            // Escape HTML
            text = text.replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;');
            
            // Highlight markdown syntax with muted colors
            text = text.replace(/(^|\n)(#{1,6})\s/g, '$1<span class="md-syntax md-heading">$2</span> ');
            text = text.replace(/(\*\*|__)/g, '<span class="md-syntax">$1</span>');
            text = text.replace(/(\*|_)(?!\*|_)/g, '<span class="md-syntax">$1</span>');
            text = text.replace(/(~~)/g, '<span class="md-syntax">$1</span>');
            text = text.replace(/(^|\n)([-*+])\s/gm, '$1<span class="md-syntax">$2</span> ');
            text = text.replace(/(^|\n)(\d+\.)\s/gm, '$1<span class="md-syntax">$2</span> ');
            text = text.replace(/(^|\n)(&gt;)\s/gm, '$1<span class="md-syntax md-quote">$2</span> ');
            text = text.replace(/(`)/g, '<span class="md-syntax">$1</span>');
            text = text.replace(/(!?\[)([^\]]*?)(\])(\()([^)]*?)(\))/g, '<span class="md-syntax">$1</span>$2<span class="md-syntax">$3$4</span>$5<span class="md-syntax">$6</span>');
            
            editorHighlight.innerHTML = text + '<br/>';
        };

        // Initialize the core markdown editor
        const defaultDirection = this.getAttribute('default-direction') || 'rtl';
        this.markdownEditor = new MarkdownEditor({
            initialText: this.getAttribute('initial-text') || '',
            autoDetectRTL: this.getAttribute('auto-detect-rtl') === 'true',
            defaultDirection: defaultDirection,
            onTextChange: (text, html) => {
                updateHighlight();
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
                    editorHighlight.classList.add('rtl');
                    editorHighlight.classList.remove('ltr');
                    preview.classList.add('rtl');
                    preview.classList.remove('ltr');
                    editorDirectionIndicator.textContent = 'RTL';
                    previewDirectionIndicator.textContent = 'RTL';
                } else {
                    editorTextarea.classList.add('ltr');
                    editorTextarea.classList.remove('rtl');
                    editorHighlight.classList.add('ltr');
                    editorHighlight.classList.remove('ltr');
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
        
        editorTextarea.addEventListener('scroll', () => {
            editorHighlight.scrollTop = editorTextarea.scrollTop;
            editorHighlight.scrollLeft = editorTextarea.scrollLeft;
        });

        // Toolbar functionality
        const toolbarButtons = this._shadowRoot.querySelectorAll('.toolbar-btn');
        toolbarButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                this.insertMarkdown(action, editorTextarea);
            });
        });

        // Control buttons
        if (toggleToolbarBtn) {
            toggleToolbarBtn.addEventListener('click', () => {
                const isVisible = toolbar.style.display !== 'none';
                toolbar.style.display = isVisible ? 'none' : 'flex';
                toggleToolbarBtn.textContent = isVisible ? '🔧 Toolbar' : '🔧 Toolbar';
                toggleToolbarBtn.style.background = isVisible ? '#4299e1' : '#38a169';
            });
        }

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
            
            // Auto-continue lists on Enter
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                const handled = this.handleEnterKeyInList(editorTextarea, e);
                if (handled) {
                    e.preventDefault();
                }
            }
        });

        // Set initial text if provided
        const initialText = this.getAttribute('initial-text');
        if (initialText) {
            editorTextarea.value = initialText;
            this.markdownEditor.setText(initialText);
        } else {
            // Trigger initial direction update even without text
            this.markdownEditor.updateDirection();
            // Trigger initial highlight
            updateHighlight();
        }
    }

    insertMarkdown(action, editorTextarea) {
        // Special handling for images
        if (action === 'image') {
            this.showImageDialog(editorTextarea);
            return;
        }
        
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
    
    handleEnterKeyInList(editorTextarea, e) {
        const cursorPos = editorTextarea.selectionStart;
        const text = editorTextarea.value;
        const lines = text.substring(0, cursorPos).split('\n');
        const currentLine = lines[lines.length - 1];
        
        // Check for unordered list
        const ulMatch = currentLine.match(/^(\s*)([-*+])\s(.*)$/);
        if (ulMatch) {
            const [, indent, bullet, content] = ulMatch;
            
            // If the list item is empty, exit list mode
            if (!content.trim()) {
                // Remove the empty list item and exit
                const beforeLine = text.substring(0, cursorPos - currentLine.length);
                const afterCursor = text.substring(cursorPos);
                editorTextarea.value = beforeLine + '\n' + afterCursor;
                editorTextarea.selectionStart = editorTextarea.selectionEnd = beforeLine.length + 1;
            } else {
                // Continue the list
                const newListItem = '\n' + indent + bullet + ' ';
                const beforeCursor = text.substring(0, cursorPos);
                const afterCursor = text.substring(cursorPos);
                editorTextarea.value = beforeCursor + newListItem + afterCursor;
                editorTextarea.selectionStart = editorTextarea.selectionEnd = cursorPos + newListItem.length;
            }
            this.markdownEditor.setText(editorTextarea.value);
            return true;
        }
        
        // Check for ordered list
        const olMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)$/);
        if (olMatch) {
            const [, indent, number, content] = olMatch;
            
            // If the list item is empty, exit list mode
            if (!content.trim()) {
                // Remove the empty list item and exit
                const beforeLine = text.substring(0, cursorPos - currentLine.length);
                const afterCursor = text.substring(cursorPos);
                editorTextarea.value = beforeLine + '\n' + afterCursor;
                editorTextarea.selectionStart = editorTextarea.selectionEnd = beforeLine.length + 1;
            } else {
                // Continue the list with incremented number
                const nextNumber = parseInt(number) + 1;
                const newListItem = '\n' + indent + nextNumber + '. ';
                const beforeCursor = text.substring(0, cursorPos);
                const afterCursor = text.substring(cursorPos);
                editorTextarea.value = beforeCursor + newListItem + afterCursor;
                editorTextarea.selectionStart = editorTextarea.selectionEnd = cursorPos + newListItem.length;
            }
            this.markdownEditor.setText(editorTextarea.value);
            return true;
        }
        
        return false;
    }
    
    showImageDialog(editorTextarea) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'image-modal-overlay';
        modal.innerHTML = `
            <div class="image-modal">
                <h3>הוסף תמונה</h3>
                <div class="modal-field">
                    <label for="imageUrl">כתובת URL של התמונה:</label>
                    <input type="text" id="imageUrl" placeholder="https://example.com/image.jpg" style="direction: ltr;" />
                </div>
                <div class="modal-field">
                    <label for="imageAlt">טקסט חלופי (תיאור):</label>
                    <input type="text" id="imageAlt" placeholder="תיאור התמונה" />
                </div>
                <div class="modal-buttons">
                    <button class="modal-btn cancel-btn">ביטול</button>
                    <button class="modal-btn insert-btn">הוסף</button>
                </div>
            </div>
        `;
        
        // Add styles for modal
        const style = document.createElement('style');
        style.textContent = `
            .image-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .image-modal {
                background: white;
                padding: 24px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 450px;
                direction: rtl;
                text-align: right;
            }
            .image-modal h3 {
                margin: 0 0 20px 0;
                color: #2d3748;
                font-size: 20px;
            }
            .modal-field {
                margin-bottom: 16px;
            }
            .modal-field label {
                display: block;
                margin-bottom: 6px;
                color: #4a5568;
                font-weight: 500;
                font-size: 14px;
            }
            .modal-field input {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                font-size: 14px;
                font-family: inherit;
                box-sizing: border-box;
                direction: rtl;
            }
            .modal-field input:focus {
                outline: none;
                border-color: #4299e1;
                box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
            }
            .modal-buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            .modal-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }
            .cancel-btn {
                background: #e2e8f0;
                color: #4a5568;
            }
            .cancel-btn:hover {
                background: #cbd5e0;
            }
            .insert-btn {
                background: #4299e1;
                color: white;
            }
            .insert-btn:hover {
                background: #3182ce;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(modal);
        
        const urlInput = modal.querySelector('#imageUrl');
        const altInput = modal.querySelector('#imageAlt');
        const insertBtn = modal.querySelector('.insert-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        // Focus the URL input
        setTimeout(() => urlInput.focus(), 100);
        
        // Handle insert
        const handleInsert = () => {
            const url = urlInput.value.trim();
            const alt = altInput.value.trim();
            
            if (!url) {
                urlInput.focus();
                urlInput.style.borderColor = '#e53e3e';
                return;
            }
            
            const start = editorTextarea.selectionStart;
            const end = editorTextarea.selectionEnd;
            const beforeText = editorTextarea.value.substring(0, start);
            const afterText = editorTextarea.value.substring(end);
            const imageMarkdown = `![${alt}](${url})`;
            
            editorTextarea.value = beforeText + imageMarkdown + afterText;
            editorTextarea.focus();
            editorTextarea.selectionStart = editorTextarea.selectionEnd = start + imageMarkdown.length;
            
            this.markdownEditor.setText(editorTextarea.value);
            
            // Remove modal
            document.body.removeChild(modal);
            document.head.removeChild(style);
        };
        
        // Handle cancel
        const handleCancel = () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
            editorTextarea.focus();
        };
        
        insertBtn.addEventListener('click', handleInsert);
        cancelBtn.addEventListener('click', handleCancel);
        
        // Handle Enter key in inputs
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!urlInput.value.trim()) return;
                altInput.focus();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        });
        
        altInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleInsert();
            } else if (e.key === 'Escape') {
                handleCancel();
            }
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        });
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
        const editorTextarea = this._shadowRoot.getElementById('editor');
        editorTextarea.value = text;
        if (this.markdownEditor) {
            this.markdownEditor.setText(text);
        }
    }

    getHTML() {
        return this.markdownEditor ? this.markdownEditor.getHTML() : '';
    }

    clear() {
        const editorTextarea = this._shadowRoot.getElementById('editor');
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
                    min-height: 64px;
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

                .editor-wrapper {
                    position: relative;
                    flex: 1;
                    overflow: hidden;
                }

                .editor-highlight {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    padding: 20px;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 16px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow: auto;
                    pointer-events: none;
                    color: #2d3748;
                    background: white;
                    z-index: 0;
                }

                .md-syntax {
                    color: #a0aec0;
                    font-weight: 400;
                }

                .md-heading {
                    color: rgba(197, 48, 231, 1);
                    font-weight: 700;
                    font-size: .8rem;
                }

                .md-quote {
                    color: #4299e1;
                }

                #editor {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    padding: 20px;
                    border: none;
                    outline: none;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 16px;
                    line-height: 1.6;
                    resize: none;
                    background: transparent;
                    color: transparent;
                    caret-color: #2d3748;
                    z-index: 1;
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

                .editor-highlight.rtl {
                    direction: rtl;
                    text-align: right;
                }

                .editor-highlight.ltr {
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
