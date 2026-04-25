'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Button from '@/components/Button';
import { receiptService } from '@/services/receiptService';
import styles from './ReceiptAmountAssistant.module.css';

const MAX_FILE_SIZE_MB = 10;

const toFormattedAmount = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return '';
  return number.toFixed(2);
};

export default function ReceiptAmountAssistant({ onAmountDetected }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const helperText = useMemo(() => {
    if (!file) return 'Upload a receipt photo, then extract amount.';
    const sizeInMb = file.size / (1024 * 1024);
    return `${file.name} (${sizeInMb.toFixed(2)} MB)`;
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      clearFile();
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setErrorMessage('Please select an image file only.');
      setSuccessMessage('');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrorMessage(`Image must be ${MAX_FILE_SIZE_MB} MB or less.`);
      setSuccessMessage('');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleExtractAmount = async () => {
    if (!file) {
      setErrorMessage('Upload a receipt image first.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await receiptService.extractAmountFromImage(file);
      if (result.amount == null) {
        setErrorMessage('No amount was detected. Try a clearer image.');
        return;
      }

      const formattedAmount = toFormattedAmount(result.amount);
      if (!formattedAmount) {
        setErrorMessage('Detected value is invalid.');
        return;
      }

      onAmountDetected(formattedAmount);
      setSuccessMessage(`Detected amount: ${formattedAmount} ${result.currency}`.trim());
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to extract receipt amount.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <label className={styles.label} htmlFor="receipt-image">
          Receipt Image (Optional)
        </label>
      </div>

      <input
        id="receipt-image"
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={handleFileChange}
      />
      <p className={styles.helperText}>{helperText}</p>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          onClick={handleExtractAmount}
          disabled={!file || isExtracting}
        >
          {isExtracting ? 'Extracting...' : 'Extract Amount (Ollama)'}
        </Button>

        {file ? (
          <Button type="button" variant="secondary" onClick={clearFile} disabled={isExtracting}>
            Remove Receipt
          </Button>
        ) : null}
      </div>

      {errorMessage ? <p className={styles.errorText}>{errorMessage}</p> : null}
      {successMessage ? <p className={styles.successText}>{successMessage}</p> : null}

      {previewUrl ? (
        <div className={styles.previewBox}>
          <p className={styles.previewLabel}>Receipt Preview</p>
          <Image
            src={previewUrl}
            alt="Uploaded receipt preview"
            width={1200}
            height={900}
            unoptimized
            className={styles.previewImage}
          />
        </div>
      ) : null}
    </div>
  );
}
