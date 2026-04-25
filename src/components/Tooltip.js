import { useState } from 'react';
import styles from './Tooltip.module.css';

export default function Tooltip({ content, children }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={styles.tooltipContainer}>
      <div
        className={styles.tooltipTrigger}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        aria-describedby="tooltip"
      >
        {children}
      </div>
      {isVisible && (
        <div id="tooltip" className={styles.tooltipContent} role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
}
