
import {
  Form,
  FormField,
  FormControl,
  FormLabel,
  FormMessage,
  FormItem,
  FormDescription
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle, } from "@/components/ui/card"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { useTranslation } from 'react-i18next'
import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"
import { useUpdateAccounts } from "@/accounts/AccountApiHooks"
import { getRouteApi } from "@tanstack/react-router"
import { useToast } from "@/components/ui/use-toast.js"
import AccountCurrencySelector from "./AccountCurrencySelector";
import AccountTimezoneSelector from "./AccountTimezoneSelector";


export function AccountCreatePage() {
  const { t } = useTranslation()
  const { create } = useUpdateAccounts()

  const { toast } = useToast();
  const routeApi = getRouteApi();
  const navigate = routeApi.useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false)

  const formSchema = z.object({
    accountid: z.string().nonempty({ message: "Account ID must be provided" }),
    name: z.string().optional(),
    institution: z.string().optional(),
    holders: z.string().optional(),
    shortname: z.string().optional(),
    type: z.string().optional(),
    category: z.string().nonempty({ message: "Category must be provided" }),
    status: z.string().optional(),
    currency: z.any().transform((e) => e.value).optional(),
    timezone: z.any().transform((e) => e.value),
  })

  const form = useForm({
    defaultValues: {
      accountid: "",
      name: "",
      institution: "",
      shortname: "",
      type: "",
      holders: "",
      category: "asset", // or liability
      status: "active",
      currency: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    resolver: zodResolver(formSchema)
  })

  // Handle form submission
  async function onSubmit(formData) {

    // console.log(`Form data:`, JSON.stringify(formData, null, 2))

    setIsSubmitting(true)
    const { data, error } = await create(formData)
    setIsSubmitting(false)

    if (error) {
      // console.error(error)
      toast({ description: error, duration: 2000, variant: "destructive" });

    } else {
      toast({ description: 'Account created successfully', duration: 2000 });
      await navigate({ to: '/accounts' });
    }
  }

  return (
    <Form {...form} className="">
      <form onSubmit={form.handleSubmit(onSubmit)}>

        {/* Center the form */}
        <div className="flex flex-col items-center">

          {/* Card container, disable rounded borders and collapse space on mobile */}
          <Card className="max-w-[650px] justify-center items-center  sm:p-0 sm:m-0   rounded-none sm:rounded-lg   border-none sm:border-solid">

            <CardHeader>
              <CardTitle>{t("Create Account")}</CardTitle>
              <CardDescription>
                {t("Add a new bank, investment, crypto, mortgage account, etc")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="gap-5 grid">

                {/* Account ID field */}
                <FormField
                  name="accountid"
                  control={form.control}
                  // rules={{ required: "Account ID is required" }}
                  render={({ field }) => (
                    <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center  ">
                      <FormLabel htmlFor="accountid" className="text-right mr-3">
                        {t("Account ID")}
                        <span className="text-red-500 ml-2">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="accountid"
                          {...field}
                          className="col-span-2"
                          data-1p-ignore
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />

                      <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
                        {t("The official account ID used by your institution. Note this is used by scrapers and importers to track this account. It must be unique.")}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Official Account Name field */}
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center  ">
                      <FormLabel htmlFor="name" className="text-right mr-3">
                        {t("Official Account Name")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="name"
                          {...field}
                          className="col-span-2"
                          data-1p-ignore
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />

                      <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
                        {t("This is the official account name, typically provided by the institution. Example: 'Savings Account'.")}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Institution field */}
                <FormField
                  name="institution"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center  ">
                      <FormLabel htmlFor="institution" className="text-right mr-3">
                        {t("Institution")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="institution"
                          {...field}
                          className="col-span-2"
                          data-1p-ignore
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />

                      <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
                        {t("Enter the full and proper name of the institution, such as 'Chase Bank' or 'Wells Fargo'.")}
                      </FormDescription>
                    </FormItem>
                  )}
                />


                {/* Account Holders field */}
                <FormField
                  name="holders"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center  ">
                      <FormLabel htmlFor="holders" className="text-right mr-3">
                        {t("Account Holders")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="holders"
                          {...field}
                          className="col-span-2"
                          data-1p-ignore
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />

                      <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
                        {t("Enter the full names of the account holders. e.g. John Doe and Jane Doe")}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Shortname field */}
                <FormField
                  name="shortname"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center  ">
                      <FormLabel htmlFor="shortname" className="text-right mr-3">
                        {t("Shortname")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="shortname"
                          {...field}
                          className="col-span-2"
                          data-1p-ignore
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />

                      <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
                        {t("A nickname for the account. Keep it brief and easy to remember. Example: 'Chase Savings'.")}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {/* Type Dropdown */}
                <FormField
                  name="type"
                  control={form.control}
                  render={({ field }) => (

                    <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center  ">
                      <FormLabel htmlFor="type" className="text-right mr-3">
                        {t("Type")}
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="col-span-2">
                            <SelectValue placeholder={t("Select Type")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Savings">{t("Savings")}</SelectItem>
                            <SelectItem value="Credit">{t("Credit")}</SelectItem>
                            <SelectItem value="Checking">{t("Checking")}</SelectItem>
                            <SelectItem value="Investment">{t("Investment")}</SelectItem>
                            <SelectItem value="Crypto">{t("Crypto")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />

                    </FormItem>
                  )}
                />



                {/* Category Dropdown */}
                <FormField
                  name="category"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center  ">
                      <FormLabel htmlFor="category" className="text-right mr-3">
                        {t("Category")}
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="col-span-2">
                            <SelectValue placeholder={t("Select Category")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asset">{t("Asset")}</SelectItem>
                            <SelectItem value="liability">{t("Liability")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />

                    </FormItem>
                  )}
                />


                {/* Status Dropdown */}
                <FormField
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center  ">
                      <FormLabel htmlFor="status" className="text-right mr-3">
                        {t("Status")}
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="col-span-2">
                            <SelectValue placeholder={t("Select Status")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{t("Active")}</SelectItem>
                            <SelectItem value="inactive">{t("Inactive")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />
                    </FormItem>
                  )}
                />

                {/* Currency Select */}
                <AccountCurrencySelector form={form} name="currency" />

                {/* Timezone Select */}
                <AccountTimezoneSelector form={form} name="timezone" />

              </div >
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("Saving...") : t("Save")}
              </Button>
            </CardFooter>

          </Card>
        </div>
      </form>
    </Form >
  )
}
