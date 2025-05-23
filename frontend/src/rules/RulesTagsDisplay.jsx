import { useState } from 'react';
import { useFetchTags } from "@/tags/TagApiHooks.js"
import { TagEditorPopover } from "@/components/TagEditorPopover"

export function RulesTagsDisplay({ id, values, onUpdate, resource, ...props }) {
  // const id = data.id;

  // bail if it is not an array
  if (!Array.isArray(values)) {
    return (<></>)
  }

  const [tags, setTags] = useState(values);
  const { data: allTags } = useFetchTags(resource); // for the select dropdown

  function _localChangeHandler(values) {
    // const values = selectedValues.map(obj => obj.value);
    setTags(values);
    
    const resourceToUpdate = (resource == "tags") ? "tag" : "party"
    var postObj = { [resourceToUpdate]: values }

    onUpdate(id, postObj).catch(error => {
      console.error('Tag Edit Error: ', error);
      setTags(data.tag);
    });
  }

  const placeholderType = (resource == "tags") ? "tag" : "party"
  const placeholder = `Select a ${placeholderType}. Type to create a ${placeholderType}...`
  
  return (
    <TagEditorPopover
      values={values}
      allValues={allTags}
      // valueAsArray={values}
      // optionsAsArray={allTags}
      cellValues={values}
      updateHandler={_localChangeHandler}
      placeholder={placeholder}
      {...props}
    />

     
  );

}