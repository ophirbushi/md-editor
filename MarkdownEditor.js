/**
 * MarkdownEditor - Core markdown editing and parsing functionality
 * Independent of DOM and application-specific features
 */
class MarkdownEditor {
    constructor(options = {}) {
        this.text = options.initialText || '';
        this.direction = 'ltr'; // 'ltr' or 'rtl'
        this.autoDetectRTL = options.autoDetectRTL !== undefined ? options.autoDetectRTL : true;
        this.manualDirection = null; // null = auto, 'ltr' or 'rtl' = manual override
        
        // Callbacks
        this.onTextChange = options.onTextChange || (() => {});
        this.onDirectionChange = options.onDirectionChange || (() => {});
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
            isRTL = this.containsRTL(this.text);
        } else if (this.manualDirection !== null) {
            // Manual mode
            isRTL = this.manualDirection === 'rtl';
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
                newText = `# ${selectedText || 'Heading 1'}`;
                cursorOffset = selectedText ? newText.length : 2;
                break;
            case 'h2':
                newText = `## ${selectedText || 'Heading 2'}`;
                cursorOffset = selectedText ? newText.length : 3;
                break;
            case 'h3':
                newText = `### ${selectedText || 'Heading 3'}`;
                cursorOffset = selectedText ? newText.length : 4;
                break;
            case 'bold':
                newText = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? newText.length : 2;
                break;
            case 'italic':
                newText = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? newText.length : 1;
                break;
            case 'strikethrough':
                newText = `~~${selectedText || 'strikethrough'}~~`;
                cursorOffset = selectedText ? newText.length : 2;
                break;
            case 'ul':
                newText = `- ${selectedText || 'list item'}`;
                cursorOffset = selectedText ? newText.length : 2;
                break;
            case 'ol':
                newText = `1. ${selectedText || 'list item'}`;
                cursorOffset = selectedText ? newText.length : 3;
                break;
            case 'quote':
                newText = `> ${selectedText || 'quote'}`;
                cursorOffset = selectedText ? newText.length : 2;
                break;
            case 'link':
                newText = `[${selectedText || 'link text'}](url)`;
                cursorOffset = selectedText ? newText.length - 4 : 1;
                break;
            case 'image':
                newText = `![${selectedText || 'alt text'}](image-url)`;
                cursorOffset = selectedText ? newText.length - 11 : 2;
                break;
            case 'code':
                newText = `\`${selectedText || 'code'}\``;
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkdownEditor;
}
