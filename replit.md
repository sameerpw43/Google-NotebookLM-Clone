# PDF Chat Application

## Overview
An AI-powered PDF chat application that enables users to upload PDF documents and interact with them through an intelligent chat interface. Built with React, Express.js, PostgreSQL, and Gemini AI.

## Purpose & Goals
- Allow users to upload large PDF files and view them in an integrated PDF viewer
- Enable natural language Q&A about PDF content using Gemini AI
- Provide accurate page citations that link directly to referenced content
- Optimize token usage through intelligent text chunking and context management
- Deliver a clean, professional UI inspired by Google NotebookLM

## Current State
The application is fully functional with:
- Complete frontend with PDF upload, viewer, and chat interface
- Backend API with PDF processing, text extraction, and AI integration
- PostgreSQL database for persistent storage of PDFs, sessions, and messages
- Gemini AI integration for intelligent responses with page citations
- Dark/light theme support

## Recent Changes (October 23, 2025)
- Initial implementation of complete PDF chat system
- Database schema with PDFs, chat sessions, and messages tables
- Frontend components: PDFUpload, PDFViewer, ChatInterface, ThemeToggle
- Backend: PDF processing with pdf-parse, Gemini AI integration
- API endpoints: upload, chat, get messages, clear chat
- File storage system for uploaded PDFs

## Project Architecture

### Frontend (React + TypeScript)
- **Pages**: Home (main app interface)
- **Components**:
  - PDFUpload: Drag-and-drop file upload with progress tracking
  - PDFViewer: Integrated PDF display with navigation and zoom controls
  - ChatInterface: Message display and input with citation buttons
  - ThemeToggle: Dark/light mode switcher
- **State Management**: TanStack Query for API data fetching and caching
- **Styling**: Tailwind CSS with Shadcn UI components, custom design system
- **PDF Rendering**: react-pdf with pdfjs-dist

### Backend (Express.js + TypeScript)
- **API Routes** (`server/routes.ts`):
  - `POST /api/upload`: Upload PDF, extract text, create session
  - `GET /api/pdfs/:id/file`: Serve PDF file
  - `GET /api/chat/:sessionId/messages`: Retrieve chat history
  - `POST /api/chat`: Send question and get AI response with citations
  - `DELETE /api/chat/:sessionId/clear`: Clear conversation history
- **Services**:
  - `pdfProcessor.ts`: PDF text extraction and metadata processing
  - `gemini.ts`: Gemini AI integration for chat completions
  - `storage.ts`: Database operations interface
  - `db.ts`: PostgreSQL connection with Drizzle ORM

### Database (PostgreSQL)
- **Tables**:
  - `pdfs`: Store uploaded PDF metadata and extracted text
  - `chat_sessions`: Track chat sessions per PDF
  - `chat_messages`: Store conversation history with citations
- **Relations**: Sessions linked to PDFs, messages linked to sessions

### File Storage
- Uploaded PDFs stored in `uploads/` directory
- Files referenced by UUID filename in database

## Key Features

### PDF Upload & Processing
- Drag-and-drop or button-based file selection
- File validation (PDF only, 50MB max)
- Upload progress tracking
- Automatic text extraction using pdf-parse
- Page count and content storage

### PDF Viewer
- Full document display with page navigation
- Zoom in/out controls (50% - 250%)
- Page counter (e.g., "5/24")
- Responsive layout for different screen sizes
- Previous/Next page buttons

### AI-Powered Chat
- Natural language question answering
- Context-aware responses using conversation history
- Automatic page citation extraction from AI responses
- Clickable citation badges that navigate to specific pages
- Message persistence across sessions
- Loading states with typing indicators
- Empty states with helpful prompts

### Citation System
- AI generates responses with [Page X] format
- Citations extracted and displayed as clickable badges
- Clicking a citation scrolls PDF viewer to that page
- Visual feedback on citation interaction

### Theme Support
- Light and dark mode themes
- Persistent theme preference in localStorage
- Smooth transitions between themes
- Accessible color contrast in both modes

## Technology Stack
- **Frontend**: React 18, TypeScript, Wouter (routing), TanStack Query
- **UI Framework**: Tailwind CSS, Shadcn UI components
- **PDF Handling**: react-pdf, pdfjs-dist, pdf-parse
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Google Gemini AI (gemini-2.5-flash model)
- **File Upload**: Multer
- **Validation**: Zod with drizzle-zod

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini API key for AI completions
- `SESSION_SECRET`: Session encryption secret

## Development Commands
- `npm run dev`: Start development server (frontend + backend)
- `npm run db:push`: Push database schema changes
- `npm run build`: Build for production

## User Preferences
- Prefers clean, professional UI with excellent visual polish
- Values responsive design and smooth interactions
- Expects production-ready functionality without mock data
- Appreciates clear information hierarchy and accessibility

## Design System
- Following Material Design with NotebookLM-inspired minimalism
- Color palette optimized for both light and dark modes
- Typography: Inter for UI, JetBrains Mono for code
- Spacing: Consistent rhythm using Tailwind units (2, 3, 4, 6, 8, 12, 16)
- Components follow design_guidelines.md specifications
- Subtle shadows and borders for visual hierarchy
- Smooth animations (200-300ms) for interactions

## Responsive Breakpoints
- Desktop (≥1024px): Side-by-side PDF viewer (60%) and chat (40%)
- Tablet (768-1023px): Tabbed interface to switch between PDF and chat
- Mobile (<768px): Stacked layout with collapsible PDF viewer

## Future Enhancements
- Vector embeddings for semantic search across PDFs
- Multi-PDF upload and cross-document querying
- PDF highlighting to visually mark cited sections
- Export chat conversations (PDF, TXT, Markdown)
- Advanced PDF processing with tables and images support
- Real-time streaming responses from AI
- User authentication and session management
