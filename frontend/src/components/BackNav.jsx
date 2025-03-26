import { ChevronLeft } from "lucide-react"
import { Link, useRouter } from "@tanstack/react-router"
import { useTranslation } from 'react-i18next'

export function BackNav() {
    const router = useRouter();
    const onBack = () => router.history.back();
    const { t } = useTranslation()

    return (
      <div className="pb-4 text-sm text-muted-foreground">
        <button
          onClick={onBack}
          className="flex items-center text-muted-foreground hover:underline"
        >
          <ChevronLeft size={16} className="mr-1" />
          {t('Back')}
        </button>
      </div>
    )
}
