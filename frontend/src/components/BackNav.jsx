import { ChevronLeft } from "lucide-react"
import { Link, useRouter } from "@tanstack/react-router"
import { useTranslation } from 'react-i18next'

export function BackNav() {
    const router = useRouter();
    const onBack = () => router.history.back();
    const { t } = useTranslation()

    return (
        <div className="pb-4 text-sm text-muted-foreground">
            <Link onClick={() => {
                onBack();
                return false;
            }}
            >
                <div className="flex items-center">
                    <ChevronLeft size={16} />
                    <div>{t('Back')}</div>
                </div>
            </Link>
        </div>
    )
}
