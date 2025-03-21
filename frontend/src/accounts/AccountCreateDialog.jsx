import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTranslation } from 'react-i18next'
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useUpdateAccounts } from "@/accounts/AccountApiHooks"

export function AccountCreateDialog() {
  const { t } = useTranslation()
  const { create } = useUpdateAccounts()

  // Step 1: Initialize useForm hook
  const { register, handleSubmit, formState: { errors } } = useForm()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 2: Handle form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true)

    // Submit the form data
    const { accountid, name, institution, shortname } = data

    // Simple validation (only account_id is mandatory)
    if (!accountid) {
      return
    }

    const postData = {
      accountid,
      name,
      institution,
      shortname,
      status: "active"
    }

    const { data: responseData, error } = await create(postData)
    setIsSubmitting(false)

    if (error) {
      console.error(error)
    } else {
      // Handle success
      console.log("Account created successfully:", responseData)
    }
  }

  return (
    <DialogContent className="sm:max-w-[625px]">
      <DialogHeader>
        <DialogTitle>{t("Create Account")}</DialogTitle>
        <DialogDescription>
          {t("Add a new bank, investment, crypto, mortgage account, etc")}
        </DialogDescription>
      </DialogHeader>

      {/* Use react-hook-form for managing the form */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <div className="grid grid-cols-3 items-center gap-2 mb-2">
          <Label htmlFor="accountid" className="text-right">
            <span className="text-red-500 mr-2">*</span>
            {t("Account ID")}
          </Label>
          <Input
            id="accountid"
            {...register("accountid", { required: "Account ID is required" })}
            className="col-span-2"
            data-1p-ignore autocomplete="off"
          />
          {errors.accountid && (
            <div className="col-start-2 col-span-2 text-sm text-red-500">
              {errors.accountid.message}
            </div>
          )}
          <div className="col-start-2 col-span-2 text-sm text-gray-500">
            {t("The official account ID used by your institution. Note this is used by scrapers and importers to track this account. It must be unique.")}
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-2 mb-2">
          <Label htmlFor="name" className="text-right">
            {t("Official Account Name")}
          </Label>
          <Input
            id="name"
            {...register("name")}
            className="col-span-2"
            data-1p-ignore autocomplete="off"
          />
          <div className="col-start-2 col-span-2 text-sm text-gray-500">
            {t("This is the official account name, typically provided by the institution. Example: 'Savings Account'.")}
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-2 mb-2">
          <Label htmlFor="institution" className="text-right">
            {t("Institution")}
          </Label>
          <Input
            id="institution"
            {...register("institution")}
            className="col-span-2"
            data-1p-ignore autocomplete="off"
          />
          <div className="col-start-2 col-span-2 text-sm text-gray-500">
            {t("Enter the full and proper name of the institution, such as 'Chase Bank' or 'Wells Fargo'. Do not use abbreviations.")}
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-2 mb-2">
          <Label htmlFor="shortname" className="text-right">
            {t("Shortname")}
          </Label>
          <Input
            id="shortname"
            {...register("shortname")}
            className="col-span-2"
            data-1p-ignore autocomplete="off"
          />
          <div className="col-start-2 col-span-2 text-sm text-gray-500">
            {t("A nickname for the account. Keep it brief and easy to remember. Example: 'Chase Savings'.")}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("Saving...") : t("Save")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
