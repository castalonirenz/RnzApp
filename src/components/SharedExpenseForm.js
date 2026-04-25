import { useState } from 'react';
import styles from './SharedExpenseForm.module.css';
import Button from './Button';
import Input from './Input';
import Alert from './Alert';

export default function SharedExpenseForm({
  initialData = null,
  onSubmit,
  isLoading = false,
  error = null,
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    amount: initialData?.amount || '',
    description: initialData?.description || '',
    participants: Array.isArray(initialData?.participants)
      ? initialData.participants.join(', ')
      : initialData?.participants || '',
  });

  const [validationError, setValidationError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setValidationError(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setValidationError('Expense title is required');
      return false;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      setValidationError('Amount must be greater than 0');
      return false;
    }

    if (!formData.participants.trim()) {
      setValidationError('At least one participant is required');
      return false;
    }

    const participants = formData.participants
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p);

    if (participants.length === 0) {
      setValidationError('At least one participant is required');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const participants = formData.participants
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p);

    const payload = {
      title: formData.title.trim(),
      amount: Number(formData.amount),
      description: formData.description.trim(),
      participants,
    };

    onSubmit(payload);
  };

  const participantList = formData.participants
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p);

  const sharePerPerson =
    participantList.length > 0
      ? (Number(formData.amount) / participantList.length).toFixed(2)
      : 0;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="title">Expense Title *</label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder="e.g., Dinner, Groceries, Hotel..."
          value={formData.title}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="amount">Total Amount *</label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={formData.amount}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          placeholder="Add notes about this expense (optional)"
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          className={styles.textarea}
          rows="3"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="participants">Participants *</label>
        <Input
          id="participants"
          name="participants"
          type="text"
          placeholder="Enter names separated by commas (e.g., John, Jane, Mike)"
          value={formData.participants}
          onChange={handleChange}
          disabled={isLoading}
        />
        <small className={styles.hint}>
          Enter participant names separated by commas
        </small>
      </div>

      {participantList.length > 0 && (
        <div className={styles.preview}>
          <div className={styles.previewItem}>
            <span className={styles.previewLabel}>Number of participants:</span>
            <span className={styles.previewValue}>{participantList.length}</span>
          </div>
          <div className={styles.previewItem}>
            <span className={styles.previewLabel}>Share per person:</span>
            <span className={styles.previewValue}>₱{sharePerPerson}</span>
          </div>
          <div className={styles.participantsList}>
            <p className={styles.participantsTitle}>Participants:</p>
            <ul className={styles.list}>
              {participantList.map((participant, index) => (
                <li key={index}>{participant}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {(error || validationError) && (
        <Alert type="error" message={error || validationError} />
      )}

      <Button
        type="submit"
        disabled={isLoading}
        variant="primary"
        className={styles.submitBtn}
      >
        {isLoading ? 'Processing...' : initialData ? 'Update Expense' : 'Create Expense'}
      </Button>
    </form>
  );
}
