
import {
  Form,
  FormField,
  FormControl,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle, } from "@/components/ui/card"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { useTranslation } from 'react-i18next'
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useUpdateAccounts } from "@/accounts/AccountApiHooks"
import { getRouteApi } from "@tanstack/react-router"
import { useToast } from "@/components/ui/use-toast.js"
import { BackNav } from "@/components/BackNav.jsx"

import AccountCurrencySelector from "./AccountCurrencySelector";
import AccountTimezoneSelector from "./AccountTimezoneSelector";
import AccountTypeSelector from "./AccountTypeSelector";
import AccountParentAccountSelector from "./AccountParentAccountSelector";
import AccountInstitutionSelector from "./AccountInstitutionSelector";
import AccountReusableInput from "./AccountReusableInput";

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
    institution: z.any().transform((e) => e.value).optional(),
    shortname: z.string().optional(),
    type: z.any().transform((e) => e.value).optional(),
    holders: z.string().optional(),
    category: z.string().nonempty({ message: "Category must be provided" }),
    status: z.string().optional(),
    currency: z.any().transform((e) => e.value).optional(),
    parentid: z.any().transform((e) => e.value).optional(),
    // timezone: z.any().transform((e) => e.value).optional(),
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
      parentid: "",
      // timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // urgh 
    },
    resolver: zodResolver(formSchema)
  })

  // gotta manage timezone manually. react-select and react-hook-form don't play nice.
  // if any of the other react-select's need a default value, we can use the same pattern.
  const [timezone, setTimezone] = useState({
    label: Intl.DateTimeFormat().resolvedOptions().timeZone,
    value: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Handle form submission
  async function onSubmit(formData) {

    // merge the manually managed data with the RHF form data
    const finalData = {
      ...formData,
      timezone: timezone.value, // manually inject controlled timezone
    };

    setIsSubmitting(true)
    const { data, error } = await create(finalData)
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
    <>

      <BackNav/>


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

                  <AccountReusableInput
                    name="accountid"
                    control={form.control}
                    label={t("Account ID")}
                    description={t("The official account ID used by your institution. Note this is used by scrapers and importers to track this account. It must be unique.")}
                    required
                  />

                  <AccountReusableInput
                    name="name"
                    control={form.control}
                    label={t("Official Account Name")}
                    description={t("This is the official account name, typically provided by the institution. Example: 'Savings Account'.")}
                  />
                  {/* 
                <AccountReusableInput
                  name="institution"
                  control={form.control}
                  label={t("Institution")}
                  description={t("Enter the full and proper name of the institution, such as 'Chase Bank' or 'Wells Fargo'.")}
                /> */}

                  {/* Type Dropdown */}
                  <AccountInstitutionSelector
                    name="institution"
                    form={form}
                    label={t("Institution")}
                    description={t("Enter the full and proper name of the institution, such as 'Chase Bank' or 'Wells Fargo'.")}
                  // placeholder={t("Choose Institution")}
                  />

                  <AccountReusableInput
                    name="holders"
                    control={form.control}
                    label={t("Account Holders")}
                    description={t("Enter the full names of the account holders. e.g. John Doe and Jane Doe")}
                  />

                  <AccountReusableInput
                    name="shortname"
                    control={form.control}
                    label={t("Shortname")}
                    description={t("A nickname for the account. Keep it brief and easy to remember. Example: 'Chase Savings'.")}
                  />


                  {/* Type Dropdown */}
                  <AccountTypeSelector
                    name="type"
                    form={form}
                    label={t("Type")}
                    description={t("Account type. Note: Start typing to create a new account type.")}
                    placeholder={t("Choose account type")}
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

                  {/* Parent Account */}
                  <AccountParentAccountSelector
                    name="parentid"
                    form={form}
                    label={t("Parent Account")}
                    description={t("Parent account is optional and somewhat rare. It is often used to put assets under a main account.")}
                    placeholder={t("Choose parent account")}
                  />

                  {/* Currency  */}
                  <AccountCurrencySelector
                    name="currency"
                    form={form}
                    label={t("Currency")}
                    description={""}
                    placeholder={t("Select currency")}
                  />

                  {/* Timezone  */}
                  <AccountTimezoneSelector
                    name="timezone"
                    label={t("Timezone")}
                    description={""}
                    value={timezone}
                    onChange={setTimezone}
                  />

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

    </>
  )
}
