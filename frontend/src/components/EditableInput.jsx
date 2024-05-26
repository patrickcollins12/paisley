import React, { useRef, useEffect, useState } from 'react';

export function EditableInput({ value, className, onFocus, ...props }) {
  const [inputValue, setInputValue] = useState(value);
  const textAreaRef = useRef(null);
  
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleFocus = (event) => {
    console.log('Textarea focused'); // Add logging to check if this is called
    if (textAreaRef.current) {
      textAreaRef.current.select();
    }
    onFocus && onFocus(event)
  };

  var cn = className || "";
  cn += " p-1 w-full rounded-md transition-all grow bg-transparent hover:bg-background";
  cn += " hover:ring-1 hover:ring-gray-300 hover:dark:ring-gray-700 ";
  cn += " focus:outline-none focus:ring-2 focus:ring-gray-700 focus:dark:ring-gray-300 resize-none";

  return (
    <textarea
      ref={textAreaRef}
      className={cn}
      value={inputValue}
      onFocus={handleFocus}
      onChange={(e) => setInputValue(e.target.value)}
      rows={1}
      {...props}
    />
  );
}
