import React, { useState, useEffect, useRef } from 'react';
import { Switch } from "@/components/ui/switch"

export function AutoCategorizeSwitch({ id, autoCategorizeValue, onAutoCategorizeChange }) {
  const [autoCategorize, setAutoCategorize] = useState(autoCategorizeValue);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Save auto categorize
  useEffect(() => {
 
    const save = async () => {

      const body = JSON.stringify({
        "id": id,
        "auto_categorize": (autoCategorize) ? 1 : 0
      })
      try {
        const response = await fetch('http://localhost:4000/update_transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: body
        });
        const responseData = await response.json();
        console.log(`Call to update_transaction succeeded: ${JSON.stringify(responseData)}\nBody: ${body}`);
      } catch (error) {
        console.error(`Failed to post tags: ${error}\nBody: ${body}`);
      }
    };

    if (isFirstRender) {
      // On first render, just mark it as not the first render anymore
      setIsFirstRender(false);
    } else {
      // On subsequent renders, execute save
      save();
    }

  }, [autoCategorize]);

  const handleAutoCategorizeSwitchChange = (event) => {
    const newValue = !autoCategorize;
    setAutoCategorize(newValue)
    onAutoCategorizeChange(newValue);
  };

  return (
    <Switch
      className="text-xs"
      checked={autoCategorize}
      onCheckedChange={handleAutoCategorizeSwitchChange}
    />
  )
}
