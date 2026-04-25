'use client';

import styles from './Button.module.css';

const normalizeSize = (size) => {
  if (!size) return 'md';
  if (size === 'small') return 'sm';
  if (size === 'medium') return 'md';
  if (size === 'large') return 'lg';
  return size;
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const normalizedSize = normalizeSize(size);
  const buttonClass = [
    styles.button,
    styles[variant],
    styles[normalizedSize],
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={buttonClass} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
