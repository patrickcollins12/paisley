import React from 'react';
import { Landmark } from "lucide-react";
import { accountTypeDetailsMap } from './accountTypes.js';
import institutionIcons from './institutionIcons.json';
import { cn } from "@/lib/utils";

const AccountIcon = ({ institution, type, className, logoClassName = "h-5 w-5", iconSize = 20 }) => {
  if (institutionIcons?.[institution]?.location) {
    const backgroundClass = institutionIcons[institution]?.background || '';
    const spanClasses = cn("mr-3 p-1 border rounded-lg", backgroundClass, className);
    return (
      <span className={spanClasses}>
        <img className={cn(logoClassName)} src={`${institutionIcons[institution]["location"]}`} alt={`${institution} logo`} />
      </span>
    );
  } else {
    const details = accountTypeDetailsMap[type?.toLowerCase()];
    const IconComponent = details?.icon || Landmark;
    const iconColor = details?.color || '#888888'; // Default grey if no color found
    const spanClasses = cn("mr-3 p-1 border rounded-lg", className);
    return (
      <span className={spanClasses}>
        <IconComponent size={iconSize} style={{ color: iconColor }} />
      </span>
    );
  }
};

export default AccountIcon; 