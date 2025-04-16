import React from 'react';
import { Landmark } from "lucide-react";
import { accountTypeIconMap } from './accountTypes';
import logos from '/src/logos/logos.json';
import { cn } from "@/lib/utils";

const AccountIcon = ({ institution, type, className, logoClassName = "h-5", iconSize = 20 }) => {
  if (logos?.[institution]?.location) {
    const backgroundClass = logos[institution]?.background || '';
    const spanClasses = cn("mr-3 p-1 border rounded-lg", backgroundClass, className);
    return (
      <span className={spanClasses}>
        <img className={cn(logoClassName)} src={`${logos[institution]["location"]}`} alt={`${institution} logo`} />
      </span>
    );
  } else {
    const IconComponent = accountTypeIconMap[type?.toLowerCase()] || Landmark;
    const spanClasses = cn("mr-3 p-1 border rounded-lg", className);
    return (
      <span className={spanClasses}>
        <IconComponent size={iconSize} className="opacity-40" />
      </span>
    );
  }
};

export default AccountIcon; 