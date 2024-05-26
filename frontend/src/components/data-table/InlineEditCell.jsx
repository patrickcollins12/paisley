import { EditableInput } from "@/components/EditableInput.jsx"
import { useState } from "react"
import { useUpdateEffect } from "react-use"

export default function InlineEditCell({id, name, value, onUpdate, ...props}) {
  const [cellValue, setCellValue] = useState(value);

  useUpdateEffect(() => {
    setCellValue(value);
  }, [value]);

  function handleBlur(evt) {
    const newValue = evt.target.value.trim();
    setCellValue(newValue);
    onUpdate(id, {
      [name]: newValue
    }).catch(error => {
      console.log('Inline Edit Error: ', error);
      setCellValue(value);
    });
  }

  function handleKeyDown(evt) {
    if (evt.keyCode !== 13) {
      return;
    }

    evt.preventDefault();
    evt.target.blur();
  }

  return (
    <EditableInput
      onBlur={handleBlur}
      spellCheck="false"
      className=" grow "
      onKeyDown={handleKeyDown}
      value={cellValue}
      {...props} />
  )
}