import React, { useEffect, useState } from 'react';

interface KoopovereenkomstViewerProps {
  pdfBase64: string;
}

const KoopovereenkomstViewer: React.FC<KoopovereenkomstViewerProps> = ({ pdfBase64 }) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    try {
      // Convert base64 to binary
      const binaryString = window.atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob and URL
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      // Cleanup
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error('Error processing PDF:', e);
      setError('Er is een fout opgetreden bij het verwerken van de PDF data');
    }
  }, [pdfBase64]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="p-4 bg-gray-50 text-gray-600 rounded-lg">
        PDF wordt geladen...
      </div>
    );
  }

  return (
    <div className="w-full h-[800px] border border-gray-200 rounded-lg overflow-hidden">
      <embed
        src={pdfUrl}
        type="application/pdf"
        className="w-full h-full"
      />
    </div>
  );
};

export default KoopovereenkomstViewer;
