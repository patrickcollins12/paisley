// components/DialogContentComponent.tsx
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next';

export function AccountCreateDialog() {
  const { t } = useTranslation();

  return (
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle>{t("Create Account")}</DialogTitle>
        <DialogDescription>
          {t("Add a new bank, investment, crypto, mortgage account, etc")}...
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            {t("Official Account Name")}
          </Label>
          <Input id="name" value="" className="col-span-3" data-1p-ignore />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="account_id" className="text-right">
            {t("Account ID")}
          </Label>
          <Input id="account_id" value="" className="col-span-3" data-1p-ignore />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="institution" className="text-right">
            {t("Institution")}
          </Label>
          <Input id="institution" value="" className="col-span-3" data-1p-ignore />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="shortname" className="text-right">
            {t("Shortname")}
          </Label>
          <Input id="shortname" value="" className="col-span-3" data-1p-ignore />
        </div>

      </div>
      <DialogFooter>
        <Button type="submit">{t("Save")}</Button>
      </DialogFooter>
    </DialogContent>
  )
}
