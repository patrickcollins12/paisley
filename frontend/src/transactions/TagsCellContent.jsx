import { useState } from 'react';
import { TransactionTagsDisplay } from "@/transactions/TransactionTagsDisplay.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.jsx";

// Define the internal component to manage hover state
export default function TagsCellContent({ row, onTransactionUpdate, onQuickRuleClick }) {
  const [isHovering, setIsHovering] = useState(false);
  const description = row.original.description;
  const autoTags = row.original.auto_tags;

  return (
    <div 
      className="grow relative" 
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <TransactionTagsDisplay
        type="tags"
        updateHandler={onTransactionUpdate}
        manual={row.original.manual_tags}
        auto={row.original.auto_tags}
        full={row.original.tags}
        rules={row.original.auto_tags_rule_ids}
        data={row.original}
        placeholder="Add tags..."
        isMulti={true}
        autoFocus={false}
        isClearable={true}
        maxMenuHeight={200}
        openMenuOnFocus={false}
      />
      {/* Conditional rendering based on hover state and autoTags */}
      {isHovering && (!autoTags || autoTags.length === 0) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation(); // Probably not needed
                onQuickRuleClick?.(description);
              }}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Quick rule</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
} 