import React, { useRef, useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

export function EditableInput({ value, className, onFocus, ...props }) {
  const [inputValue, setInputValue] = useState(value);
  const textAreaRef = useRef(null);
  

  // Synchronize internal state with the value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // adjust the size of the text area based on the number of lines, while 
  // still keeping the scrollbars off.
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  // select all the text select'ed when 
  // focussed
  const handleFocus = (event) => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
    }
    onFocus && onFocus(event)
  };

  var c = className || "";
  c += " p-1 w-full rounded-md transition-all grow bg-transparent hover:bg-background";
  c += " hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-700 ";
  c += " focus:outline-hidden focus:ring-2 focus:ring-gray-700 dark:focus:ring-gray-300";
  c += " overflow-hidden resize-none"; // remove scrolling and scrollbars in the textarea

  return (
    <textarea
      ref={textAreaRef}
      className={cn(c,className)}
      value={inputValue}
      onFocus={handleFocus}
      onChange={(e) => setInputValue(e.target.value)}
      rows={1}
      {...props}
    />
  );
}
