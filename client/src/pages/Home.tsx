import { useState } from 'react';
import { PDFUpload } from '@/components/PDFUpload';
import { PDFViewer } from '@/components/PDFViewer';
import { ChatInterface } from '@/components/ChatInterface';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'pdf' | 'chat'>('pdf');

  const handleUploadSuccess = (newPdfId: string, newSessionId: string, newFilename: string) => {
    setPdfId(newPdfId);
    setSessionId(newSessionId);
    setFilename(newFilename);
    setCurrentPage(1);
  };

  const handleNewChat = () => {
    setPdfId(null);
    setSessionId(null);
    setFilename('');
    setCurrentPage(1);
  };

  const handleCitationClick = (page: number) => {
    setCurrentPage(page);
    // Switch to PDF tab on mobile when citation is clicked
    if (window.innerWidth < 1024) {
      setActiveTab('pdf');
    }
  };

  if (!pdfId || !sessionId) {
    return <PDFUpload onUploadSuccess={handleUploadSuccess} />;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <FileText className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">PDF Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="gap-2"
            data-testid="button-new-chat"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Side by side */}
        <div className="hidden lg:flex lg:flex-1">
          <div className="w-[60%]">
            <PDFViewer
              pdfId={pdfId}
              filename={filename}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
          <div className="w-[40%]">
            <ChatInterface sessionId={sessionId} onCitationClick={handleCitationClick} />
          </div>
        </div>

        {/* Mobile/Tablet: Stacked with tabs */}
        <div className="flex flex-col flex-1 lg:hidden" data-testid="mobile-container">
          <div className="flex border-b border-border bg-card" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'pdf'}
              aria-controls="pdf-panel"
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'pdf'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover-elevate'
              }`}
              onClick={() => setActiveTab('pdf')}
              data-testid="tab-button-pdf"
            >
              PDF
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              aria-controls="chat-panel"
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover-elevate'
              }`}
              onClick={() => setActiveTab('chat')}
              data-testid="tab-button-chat"
            >
              Chat
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <div
              id="pdf-panel"
              role="tabpanel"
              aria-hidden={activeTab !== 'pdf'}
              className={activeTab === 'pdf' ? 'h-full' : 'hidden'}
            >
              <PDFViewer
                pdfId={pdfId}
                filename={filename}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
            <div
              id="chat-panel"
              role="tabpanel"
              aria-hidden={activeTab !== 'chat'}
              className={activeTab === 'chat' ? 'h-full' : 'hidden'}
            >
              <ChatInterface sessionId={sessionId} onCitationClick={handleCitationClick} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
