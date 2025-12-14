# Markdown Editor

A markdown editor with RTL (Right-to-Left) support for Hebrew, Arabic, and other RTL languages, available as a reusable **Web Component**.

## Quick Start

### Using the Web Component

```html
<!DOCTYPE html>
<html>
<head>
    <script src="MarkdownEditor.js"></script>
    <script src="markdown-editor-component.js"></script>
</head>
<body>
    <markdown-editor></markdown-editor>
</body>
</html>
```

### With Configuration

```html
<markdown-editor 
    initial-text="# Hello World"
    auto-detect-rtl="true"
    show-toolbar="true"
    show-controls="true"
    placeholder="Start typing...">
</markdown-editor>
```

## Web Component API

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `initial-text` | string | `""` | Initial markdown text |
| `auto-detect-rtl` | boolean | `true` | Enable/disable RTL auto-detection |
| `show-toolbar` | boolean | `true` | Show/hide formatting toolbar |
| `show-controls` | boolean | `true` | Show/hide control buttons |
| `placeholder` | string | `"Type your markdown here..."` | Placeholder text |

### Methods

```javascript
const editor = document.querySelector('markdown-editor');

// Get current markdown text
const text = editor.getText();

// Set markdown text
editor.setText('# New Content');

// Get HTML output
const html = editor.getHTML();

// Clear editor
editor.clear();
```

### Events

```javascript
const editor = document.querySelector('markdown-editor');

// Listen for text changes
editor.addEventListener('text-change', (e) => {
    console.log('Text:', e.detail.text);
    console.log('HTML:', e.detail.html);
});

// Listen for direction changes
editor.addEventListener('direction-change', (e) => {
    console.log('Direction:', e.detail.direction); // 'ltr' or 'rtl'
});
```

## Architecture

The project is organized into three layers:

### 1. Core Editor Layer (`MarkdownEditor.js`)
The core markdown editing functionality, completely independent of DOM and application-specific features.

**Key Features:**
- Markdown parsing to HTML
- RTL text detection
- Direction management (auto-detect or manual)
- Markdown syntax insertion helpers
- Pure JavaScript class with no DOM dependencies

**Public API:**
```javascript
const editor = new MarkdownEditor({
    initialText: '',
    autoDetectRTL: true,
    onTextChange: (text, html) => { /* callback */ },
    onDirectionChange: (direction) => { /* callback */ }
});

// Methods
editor.setText(text)           // Update editor text
editor.getText()               // Get current text
editor.getHTML()               // Get parsed HTML
editor.getDirection()          // Get current direction ('ltr' or 'rtl')
editor.toggleDirection()       // Toggle direction manually
editor.setAutoDetectRTL(bool)  // Enable/disable auto-detection
editor.insertMarkdown(action, selectedText, position) // Insert markdown syntax
editor.clear()                 // Clear all text
```

### 2. Web Component Layer (`markdown-editor-component.js`)
Encapsulates the editor as a reusable web component with Shadow DOM for style isolation.

**Features:**
- Custom element `<markdown-editor>`
- Shadow DOM encapsulation
- Configurable via attributes
- Event-driven API
- Framework-agnostic

### 3. Application Layer (`app.js`)
Legacy application layer for backward compatibility (optional, not needed when using the web component).

## File Structure

```
md-editor/
├── MarkdownEditor.js                 # Core editor (framework-agnostic)
├── markdown-editor-component.js      # Web Component wrapper
├── app.js                            # Legacy application layer
├── index.html                        # Simple demo using web component
├── demo.html                         # Comprehensive demo with examples
├── styles.css                        # Legacy styles (not needed for web component)
├── package.json                      # Dependencies
└── README.md                         # This file
```

## Usage Examples

### Example 1: Minimal Setup

```html
<markdown-editor></markdown-editor>
```

### Example 2: No Toolbar or Controls (Clean Editor)

```html
<markdown-editor 
    show-toolbar="false" 
    show-controls="false">
</markdown-editor>
```

### Example 3: Programmatic Control

```html
<markdown-editor id="editor"></markdown-editor>

<script>
const editor = document.getElementById('editor');

// Set initial content
editor.setText('# My Document\n\nContent here...');

// Get content when needed
const saveBtn = document.getElementById('save');
saveBtn.addEventListener('click', () => {
    const markdown = editor.getText();
    const html = editor.getHTML();
    // Save to server...
});
</script>
```

### Example 4: React Integration

```jsx
import { useEffect, useRef } from 'react';

function MarkdownEditorWrapper() {
    const editorRef = useRef(null);

    useEffect(() => {
        const editor = editorRef.current;
        
        const handleChange = (e) => {
            console.log('Content:', e.detail.text);
        };

        editor.addEventListener('text-change', handleChange);
        return () => editor.removeEventListener('text-change', handleChange);
    }, []);

    return (
        <markdown-editor 
            ref={editorRef}
            initial-text="# Hello from React"
        />
    );
}
```

### Example 5: Vue Integration

```vue
<template>
    <markdown-editor 
        ref="editor"
        @text-change="handleTextChange"
    />
</template>

<script>
export default {
    methods: {
        handleTextChange(e) {
            console.log('Content:', e.detail.text);
        },
        saveContent() {
            const text = this.$refs.editor.getText();
            // Save logic...
        }
    }
}
</script>
```

## Running the Demo

```bash
npm install
npm start
```

Then open:
- `http://localhost:9080` - Simple editor
- `http://localhost:9080/demo.html` - Full demo with API examples

## Benefits of the Web Component Architecture

1. **Reusability**: Use in any HTML page or framework (React, Vue, Angular, etc.)
2. **Encapsulation**: Shadow DOM isolates styles and prevents conflicts
3. **Framework-Agnostic**: Works with vanilla JS or any framework
4. **Clean API**: Simple attributes and methods for configuration
5. **Event-Driven**: Standard DOM events for integration
6. **Self-Contained**: All styles and logic bundled in the component

## Browser Support

Works in all modern browsers that support:
- Custom Elements v1
- Shadow DOM v1
- ES6 Classes

(Chrome, Firefox, Safari, Edge - all recent versions)

## Features

- Live markdown preview
- RTL language support (Hebrew, Arabic, etc.)
- Auto-detection of text direction
- Manual direction toggle
- Toolbar for common markdown operations
- Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- Download as .md file
- Supports: headers, bold, italic, strikethrough, lists, links, images, code, blockquotes

## License

ISC
