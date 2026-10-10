import { useRef, useEffect } from 'react';

export const AutoExpandingTextarea = ({ value, onChange, className, placeholder, disabled, style, onClick }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      onClick={onClick}
      className={`${className} overflow-hidden resize-none w-full block`}
      style={{ ...style, minHeight: '1.5rem' }}
    />
  );
};
