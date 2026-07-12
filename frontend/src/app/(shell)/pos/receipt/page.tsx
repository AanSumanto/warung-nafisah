import { Suspense } from 'react';
import { ReceiptPreviewContent } from './ReceiptPreviewContent';

export default function ReceiptPreviewPage() {
  return (
    <Suspense fallback={null}>
      <ReceiptPreviewContent />
    </Suspense>
  );
}
