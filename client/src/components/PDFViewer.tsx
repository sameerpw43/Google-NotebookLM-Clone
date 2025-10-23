import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  pdfId: string;
  filename: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PDFViewer({ pdfId, filename, currentPage, onPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('pdf-container');
      if (container) {
        setContainerWidth(container.offsetWidth - 48);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col h-screen border-r border-border bg-muted/30">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate" data-testid="text-pdf-filename">
            {filename}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 rounded-md bg-muted">
            <span className="text-sm font-medium text-foreground" data-testid="text-page-counter">
              {currentPage} / {numPages || '...'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={scale >= 2.5}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div
        id="pdf-container"
        className="flex-1 overflow-auto p-6 flex justify-center"
        data-testid="pdf-canvas-container"
      >
        <Document
          file={`/api/pdfs/${pdfId}/file`}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-12 h-12 text-primary animate-spin" data-testid="pdf-loading-spinner" />
            </div>
          }
        >
          <div className="bg-white shadow-xl" style={{ width: 'fit-content' }}>
            <Page
              pageNumber={currentPage}
              scale={scale}
              width={containerWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </div>
        </Document>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-border bg-card">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="gap-2"
          data-testid="button-prev-page"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage >= numPages}
          className="gap-2"
          data-testid="button-next-page"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
