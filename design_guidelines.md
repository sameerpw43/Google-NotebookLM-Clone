# PDF Chat Application Design Guidelines

## Design Approach
**Selected System:** Material Design with NotebookLM-inspired minimalism
**Rationale:** Productivity-focused application requiring clean information hierarchy, efficient space usage, and professional aesthetic for document interaction.

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: 222 15% 12% (deep neutral)
- Surface: 222 15% 16% (elevated cards)
- Surface variant: 222 12% 20% (PDF viewer, input fields)
- Primary: 210 100% 60% (actions, links, citations)
- Primary variant: 210 100% 50% (hover states)
- Text primary: 0 0% 95%
- Text secondary: 0 0% 70%
- Border: 222 10% 25%
- Success: 142 70% 45% (upload confirmation)
- Error: 0 70% 50% (file errors)

**Light Mode:**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Surface variant: 220 15% 96%
- Primary: 210 100% 50%
- Text primary: 0 0% 10%
- Text secondary: 0 0% 40%
- Border: 220 10% 88%

### B. Typography
**Font Families:**
- Primary: 'Inter' (Google Fonts) - UI elements, chat
- Monospace: 'JetBrains Mono' - code snippets, technical details

**Hierarchy:**
- Display (PDF title): 600 weight, 24px
- Heading (section titles): 600 weight, 18px
- Body (chat messages): 400 weight, 15px
- Caption (metadata, timestamps): 400 weight, 13px
- Button text: 500 weight, 14px

### C. Layout System
**Spacing Units:** Tailwind units of 2, 3, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4, p-6
- Section gaps: gap-4, gap-6
- Large spacing: my-8, my-12

**Grid Structure:**
- Desktop: 2-column split (PDF viewer 60% | Chat 40%)
- Tablet: Tabbed interface (switch between PDF/Chat)
- Mobile: Vertical stack, collapsible PDF viewer

### D. Component Library

**PDF Viewer Section:**
- Full-height container with border-r
- Top toolbar: filename, page counter (e.g., "5/24"), zoom controls, download button
- PDF canvas: centered with subtle shadow
- Navigation: previous/next page buttons, scroll-based navigation
- Loading state: skeleton with animated pulse

**Chat Interface:**
- Sticky header: "Chat with PDF" title, clear conversation button
- Message container: flex-col with max-h and overflow-auto
- Message bubbles:
  - User: ml-auto, max-w-[80%], bg-primary, rounded-2xl
  - AI: mr-auto, max-w-[85%], bg-surface-variant, rounded-2xl
- Citation buttons: inline chips with page numbers (e.g., "p.5"), primary color, rounded-full, on-click scrolls PDF
- Input area: sticky bottom, textarea with auto-resize, send button with icon

**Upload Experience:**
- Initial state: centered card with dashed border
- Drag-and-drop zone: large dropzone with icon, "Drop PDF here" text
- File input button: primary, "Select PDF File"
- Upload progress: linear progress bar with percentage
- File preview: thumbnail with filename, size, remove option

**Navigation Bar:**
- Horizontal layout: logo/title left, "New Chat" button right
- Height: h-16
- Border bottom with subtle shadow

### E. Interaction Patterns

**Citation Navigation:**
- Citation buttons appear inline within AI responses
- Hover: scale(1.05) with subtle shadow
- Click: smooth scroll to PDF page with highlight animation
- Visual feedback: brief yellow highlight on target page

**PDF Controls:**
- Zoom: +/- buttons with current zoom percentage display
- Page navigation: arrow buttons disabled at boundaries
- Keyboard shortcuts: Arrow keys for pages, +/- for zoom

**Chat Interactions:**
- Send button: disabled state when empty input
- Loading state: typing indicator (three animated dots)
- Auto-scroll to latest message
- Timestamp on hover for each message

**Responsive Behavior:**
- Desktop (≥1024px): Side-by-side split
- Tablet (768-1023px): Tab switcher at top
- Mobile (<768px): Stacked, PDF collapsible with header button

### F. Visual Enhancements

**Shadows:**
- Cards: shadow-md
- Elevated elements: shadow-lg
- PDF viewer: shadow-xl for depth

**Borders:**
- Subtle: 1px solid border-color
- Inputs focus: 2px solid primary color

**Animations:**
- Page transitions: 200ms ease
- Button hover: 150ms ease
- Message appearance: fade-in 300ms
- Citation highlight: pulse 600ms

## Images

**No hero image required** - This is a utility application focused on functionality. However:

**PDF Thumbnails:**
- Generate thumbnail previews of uploaded PDFs (first page)
- Display in upload history/sidebar if implementing multi-PDF support
- Size: 120x160px with aspect ratio maintained

**Empty States:**
- Upload zone icon: Document upload illustration (simple line art)
- No messages yet: Minimalist conversation icon
- Error states: Warning/error icons from Material Icons

**Icons:** Material Icons via CDN for all UI elements (upload, send, zoom, page navigation, etc.)

## Key Principles
1. **Information Density:** Maximize visible content without clutter
2. **Scannable Hierarchy:** Clear distinction between user/AI messages and citations
3. **Responsive Split:** Adapt layout fluidly across devices
4. **Minimal Distraction:** Subtle animations, focus on content
5. **Accessible Navigation:** Keyboard shortcuts and clear interactive states