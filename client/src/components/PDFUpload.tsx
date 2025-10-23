import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface PDFUploadProps {
  onUploadSuccess: (pdfId: string, sessionId: string, filename: string) => void;
}

export function PDFUpload({ onUploadSuccess }: PDFUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');

    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);

      const response = await uploadPromise;

      toast({
        title: 'Upload successful',
        description: `${file.name} has been uploaded and processed`,
      });

      onUploadSuccess(response.pdf.id, response.session.id, response.pdf.originalName);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <Card
        className={`w-full max-w-2xl p-12 transition-all duration-200 ${
          isDragging ? 'border-primary border-2 bg-accent/50' : 'border-dashed border-2'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="upload-dropzone"
      >
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          {isUploading ? (
            <>
              <Loader2 className="w-16 h-16 text-primary animate-spin" data-testid="upload-spinner" />
              <div className="w-full max-w-md space-y-3">
                <p className="text-lg font-medium text-foreground">Uploading and processing...</p>
                <Progress value={uploadProgress} className="h-2" data-testid="upload-progress" />
                <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-24 h-24 rounded-full bg-accent">
                <FileText className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">Upload your PDF</h2>
                <p className="text-base text-muted-foreground max-w-md">
                  Drag and drop your PDF file here, or click the button below to select a file
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => document.getElementById('file-input')?.click()}
                  data-testid="button-select-pdf"
                >
                  <Upload className="w-5 h-5" />
                  Select PDF File
                </Button>
              </div>
              <input
                id="file-input"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-file"
              />
              <p className="text-sm text-muted-foreground">
                Maximum file size: 50MB
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
