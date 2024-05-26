import { useState } from 'react';
import { useFetchTags } from "@/tags/TagApiHooks.js"
import { TagEditorPopover } from "@/components/TagEditorPopover"

export function RulesTagsDisplay({ id, values, onUpdate, resource }) {
  // const id = data.id;

  // bail if it is not an array
  if (!Array.isArray(values)) {
    return (<></>)
  }

  const [tags, setTags] = useState(values);
  const { data: allTags } = useFetchTags(resource); // for the select dropdown

  function onChange(selectedValues) {
    setTags(selectedValues);
    const resourceToUpdate = (resource=="tags")?"tag":"party"
    var postObj = { [resourceToUpdate]: selectedValues}
    onUpdate(id, postObj).catch(error => {
      console.error('Tag Edit Error: ', error);
      setTags(data.tag);
    });
  }

  return (
    <TagEditorPopover values={values} allValues={allTags} onChange={onChange} inputPlaceholder="Add a tag..." />
  );

}