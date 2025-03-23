// import {
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogClose
// } from "@/components/ui/dialog"

// import {
//   Form,
//   FormField,
//   FormControl,
//   FormLabel,
//   FormMessage,
//   FormItem,
//   FormDescription
// } from "@/components/ui/form"

// import { z } from "zod"
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
// import { useTranslation } from 'react-i18next'
// import { useForm, Controller } from "react-hook-form"
// import { useState } from "react"
// import { useUpdateAccounts } from "@/accounts/AccountApiHooks"


// export function AccountCreateDialog() {

//   const { t } = useTranslation()
//   const { create } = useUpdateAccounts()

//   const formSchema = z.object({
//     accountid: z.string().min(2).max(50),
//     name: z.string().min(1).optional(),  // Optional field
//     institution: z.string().min(1).optional(),  // Optional field
//     shortname: z.string().min(1).optional(),  // Optional field
//     type: z.string().min(1).optional(),  // Optional field
//     category: z.string().min(1).optional(),  // Optional field
//     status: z.string().min(1).optional(),  // Optional field
//     currency: z.string().min(1).optional(),  // Optional field
//   })

//   const form = useForm({
//     defaultValues: {
//       accountid: "", 
//       name: "",
//       institution: "",
//       shortname: "",
//       type: "",
//       category: "asset",
//       status: "active",
//       currency: "",
//     },
//     resolver: zodResolver(formSchema)
//   })

//   const [isSubmitting, setIsSubmitting] = useState(false)

//   // Handle form submission
//   async function onSubmit(formData) {
//     console.log(`Form data:`, formData)
//     setIsSubmitting(true)
//     const { data, error } = await create(formData)
//     setIsSubmitting(false)

//     if (error) {
//       console.error(error)
//     } else {
//       console.log("Account created successfully:", data)
//     }
//   }

//   return (
//     <DialogContent className="sm:max-w-[625px]" >
//       <DialogHeader>
//         <DialogTitle>{t("Create Account")}</DialogTitle>
//         <DialogDescription>
//           {t("Add a new bank, investment, crypto, mortgage account, etc")}
//         </DialogDescription>
//       </DialogHeader>

//       {/* Use Shadcn's Form components */}
//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">

//           {/* Account ID field */}
//           <FormField
//             name="accountid"
//             control={form.control}
//             // rules={{ required: "Account ID is required" }}
//             render={({ field }) => (
//               <FormItem className="grid space-y-0 gap-1 grid-cols-3 items-center  ">
//                 <FormLabel htmlFor="accountid" className="text-right mr-3">
//                   <span className="text-red-500 mr-2">*</span>
//                   {t("Account ID")}
//                 </FormLabel>
//                 <FormControl>
//                   <Input
//                     id="accountid"
//                     {...field}
//                     className="col-span-2"
//                     data-1p-ignore
//                     autoComplete="off"
//                   />
//                 </FormControl>
//                 <FormMessage className="col-start-2" />

//                 <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
//                   {t("The official account ID used by your institution. Note this is used by scrapers and importers to track this account. It must be unique.")}
//                 </FormDescription>
//               </FormItem>
//             )}
//           />

//           {/* Official Account Name field */}
//           <FormField
//             name="name"
//             control={form.control}
//             render={({ field }) => (
//               <FormItem className="grid space-y-0 gap-1 grid-cols-3 items-center  ">
//                 <FormLabel htmlFor="name" className="text-right mr-3">
//                   {t("Official Account Name")}
//                 </FormLabel>
//                 <FormControl>
//                   <Input
//                     id="name"
//                     {...field}
//                     className="col-span-2"
//                     data-1p-ignore
//                     autoComplete="off"
//                   />
//                 </FormControl>
//                 <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
//                   {t("This is the official account name, typically provided by the institution. Example: 'Savings Account'.")}
//                 </FormDescription>
//               </FormItem>
//             )}
//           />

//           {/* Institution field */}
//           <FormField
//             name="institution"
//             control={form.control}
//             render={({ field }) => (
//               <FormItem className="grid space-y-0 gap-1 grid-cols-3 items-center  ">
//                 <FormLabel htmlFor="institution" className="text-right mr-3">
//                   {t("Institution")}
//                 </FormLabel>
//                 <FormControl>
//                   <Input
//                     id="institution"
//                     {...field}
//                     className="col-span-2"
//                     data-1p-ignore
//                     autoComplete="off"
//                   />
//                 </FormControl>
//                 <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
//                   {t("Enter the full and proper name of the institution, such as 'Chase Bank' or 'Wells Fargo'.")}
//                 </FormDescription>
//               </FormItem>
//             )}
//           />

//           {/* Shortname field */}
//           <FormField
//             name="shortname"
//             control={form.control}
//             render={({ field }) => (
//               <FormItem className="grid space-y-0 gap-1 grid-cols-3 items-center  ">
//                 <FormLabel htmlFor="shortname" className="text-right mr-3">
//                   {t("Shortname")}
//                 </FormLabel>
//                 <FormControl>
//                   <Input
//                     id="shortname"
//                     {...field}
//                     className="col-span-2"
//                     data-1p-ignore
//                     autoComplete="off"
//                   />
//                 </FormControl>
//                 <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
//                   {t("A nickname for the account. Keep it brief and easy to remember. Example: 'Chase Savings'.")}
//                 </FormDescription>
//               </FormItem>
//             )}
//           />

//           {/* Type Dropdown */}
//           <FormField
//             name="type"
//             control={form.control}
//             render={({ field }) => (

//               <FormItem className="grid space-y-0 gap-1 grid-cols-3 items-center  ">
//                 <FormLabel htmlFor="type" className="text-right mr-3">
//                   {t("Type")}
//                 </FormLabel>
//                 <FormControl>
//                   <Select onValueChange={field.onChange} defaultValue={field.value}>
//                     <SelectTrigger className="col-span-2">
//                       <SelectValue placeholder={t("Select Type")} />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="savings">{t("Savings")}</SelectItem>
//                       <SelectItem value="credit">{t("Credit")}</SelectItem>
//                       <SelectItem value="checking">{t("Checking")}</SelectItem>
//                       <SelectItem value="investment">{t("Investment")}</SelectItem>
//                       <SelectItem value="crypto">{t("Crypto")}</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </FormControl>
//               </FormItem>
//             )}
//           />



//           {/* Category Dropdown */}
//           <FormField
//             name="category"
//             control={form.control}
//             render={({ field }) => (
//               <FormItem className="grid space-y-0 gap-1 grid-cols-3 items-center  ">
//                 <FormLabel htmlFor="category" className="text-right mr-3">
//                   {t("Category")}
//                 </FormLabel>
//                 <FormControl>
//                   <Select onValueChange={field.onChange} defaultValue={field.value}>
//                     <SelectTrigger className="col-span-2">
//                       <SelectValue placeholder={t("Select Category")} />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="asset">{t("Asset")}</SelectItem>
//                       <SelectItem value="liability">{t("Liability")}</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </FormControl>
//               </FormItem>
//             )}
//           />


//           {/* Status Dropdown */}
//           <FormField
//             name="status"
//             control={form.control}
//             render={({ field }) => (
//               <FormItem className="grid space-y-0 gap-1 grid-cols-3 items-center  ">
//                 <FormLabel htmlFor="status" className="text-right mr-3">
//                   {t("Status")}
//                 </FormLabel>
//                 <FormControl>
//                   <Select onValueChange={field.onChange} defaultValue={field.value}>
//                     <SelectTrigger className="col-span-2">
//                       <SelectValue placeholder={t("Select Status")} />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="active">{t("Active")}</SelectItem>
//                       <SelectItem value="inactive">{t("Inactive")}</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </FormControl>
//               </FormItem>
//             )}
//           />

//           {/* Currency Input */}
//           <FormField
//             name="currency"
//             control={form.control}
//             render={({ field }) => (
//               <FormItem className="grid space-y-0 gap-1 grid-cols-3 items-center  ">
//                 <FormLabel htmlFor="currency" className="text-right mr-3">
//                   {t("Currency")}
//                 </FormLabel>
//                 <FormControl>
//                   <Input
//                     id="currency"
//                     {...field}
//                     className="col-span-2"
//                     data-1p-ignore autoComplete="off"
//                   />
//                 </FormControl>

//                 <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
//                   {t("Refer to ISO 4217 currency codes. e.g. AUD, USD, EUR")}
//                 </FormDescription>

//               </FormItem>
//             )}
//           />

//           <DialogFooter>
//             {/* <DialogClose asChild> */}
//             <Button type="submit" disabled={isSubmitting}>
//               {isSubmitting ? t("Saving...") : t("Save")}
//             </Button>
//             {/* </DialogClose> */}
//           </DialogFooter>
//         </form>
//       </Form >
//     </DialogContent >
//   )
// }
