# Markdown Editor

A markdown editor with RTL (Right-to-Left) support for Hebrew, Arabic, and other RTL languages.

## Architecture

The application is separated into two distinct layers:

### Core Editor Layer (`MarkdownEditor.js`)
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

### Application Layer (`app.js`)
The UI integration layer that wraps the core editor with application-specific features.

**Responsibilities:**
- DOM element management
- Event handling (buttons, keyboard shortcuts)
- LocalStorage persistence
- File download functionality
- Toolbar interactions
- UI state synchronization

## Usage

### As a Standalone Component
You can use `MarkdownEditor.js` in any JavaScript project:

```javascript
import MarkdownEditor from './MarkdownEditor.js';

const editor = new MarkdownEditor({
    onTextChange: (text, html) => {
        document.getElementById('preview').innerHTML = html;
    }
});

editor.setText('# Hello World');
```

### In This Application
The full application with UI is ready to use:

```bash
npm install
npm start
```

Then open `http://localhost:9080` in your browser.

## File Structure

```
md-editor/
├── MarkdownEditor.js    # Core editor (framework-agnostic)
├── app.js               # Application layer (DOM integration)
├── index.html           # HTML structure
├── styles.css           # Styling
├── package.json         # Dependencies
└── README.md            # This file
```

## Benefits of This Architecture

1. **Separation of Concerns**: Core logic is separate from UI implementation
2. **Reusability**: `MarkdownEditor.js` can be used in other projects
3. **Testability**: Core editor can be tested without DOM dependencies
4. **Maintainability**: Clear boundaries between layers
5. **Flexibility**: Easy to swap UI frameworks while keeping the core logic

## Features

- Live markdown preview
- RTL language support (Hebrew, Arabic, etc.)
- Auto-detection of text direction
- Manual direction toggle
- Toolbar for common markdown operations
- Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- LocalStorage auto-save
- Download as .md file
- Supports: headers, bold, italic, strikethrough, lists, links, images, code, blockquotes

## License

ISC
