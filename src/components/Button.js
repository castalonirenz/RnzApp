'use client';

import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', size = 'md', disabled = false, ...props }) {
  const buttonClass = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
  ].filter(Boolean).join(' ');

  return (
    <button className={buttonClass} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
