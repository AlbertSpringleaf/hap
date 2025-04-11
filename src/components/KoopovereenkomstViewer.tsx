import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface KoopovereenkomstViewerProps {
  pdfData: string;
}

export default function KoopovereenkomstViewer({ pdfData }: KoopovereenkomstViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

  // Create data URL only when component mounts to avoid unnecessary re-renders
  useEffect(() => {
    if (pdfData) {
      setPdfDataUrl(`data:application/pdf;base64,${pdfData}`);
      setIsLoading(false);
    }
  }, [pdfData]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
  }

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setPageNumber(page => Math.max(1, page - 1))}
          disabled={pageNumber <= 1 || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Vorige
        </button>
        <span className="px-4 py-2">
          Pagina {pageNumber} van {numPages}
        </span>
        <button
          onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
          disabled={pageNumber >= numPages || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Volgende
        </button>
      </div>
      <div className="w-full h-full overflow-auto border border-gray-200 rounded-lg">
        {isLoading && !pdfDataUrl ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : pdfDataUrl ? (
          <Document
            file={pdfDataUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            }
            options={{
              cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
              cMapPacked: true,
              standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
            }}
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              scale={1.2}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              }
            />
          </Document>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Geen PDF beschikbaar</p>
          </div>
        )}
      </div>
    </div>
  );
} 