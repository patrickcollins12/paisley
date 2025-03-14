import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { formatDate } from "@/lib/localisation_utils.js";
import { useTranslation } from 'react-i18next';

export function DateTimeDisplay({ datetime, options = { delta: false, absolute: true } }) {
  // get the browser timezone
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { t } = useTranslation();

  const hc = (
    <HoverCardContent align="start">
      <div>
        <p>{datetime}</p>
        <p>{formatDate(datetime, options)}</p>
        <p>{t("TZ of browser")}: {tz}</p>
      </div>
    </HoverCardContent>
  );

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span>
          <a href="#" className="whitespace-nowrap">
            {formatDate(datetime, options)}
          </a>
        </span>
      </HoverCardTrigger>
      {hc}
    </HoverCard>
  );
}
