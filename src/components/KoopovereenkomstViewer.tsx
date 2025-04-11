import { useState } from 'react';
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

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Convert base64 to Uint8Array for PDF.js
  const pdfBytes = new Uint8Array(Buffer.from(pdfData, 'base64'));

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setPageNumber(page => Math.max(1, page - 1))}
          disabled={pageNumber <= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Vorige
        </button>
        <span className="px-4 py-2">
          Pagina {pageNumber} van {numPages}
        </span>
        <button
          onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
          disabled={pageNumber >= numPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Volgende
        </button>
      </div>
      <div className="w-full h-full overflow-auto border border-gray-200 rounded-lg">
        <Document
          file={pdfBytes}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            scale={1.2}
          />
        </Document>
      </div>
    </div>
  );
} 