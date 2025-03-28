import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// The account form was getting really long just repeating this boiler plate over and over.
const AccountReusableInput = ({
  name,
  control,
  label,
  description,
  required = false,
  ...props
}) => {
  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => (
        <FormItem className="sm:grid space-y-0 gap-1 grid-cols-3 items-center">
          <FormLabel htmlFor={name} className="text-right mr-3">
            {label}
            {required && <span className="text-red-500 ml-2">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              id={name}
              {...field}
              {...props}
              className={`col-span-2 ${props.className || ""}`}
              data-1p-ignore
              autoComplete="off"
            />
          </FormControl>
          <FormMessage className="col-start-2 col-span-2" />
          <FormDescription className="col-start-2 col-span-2 text-sm text-gray-500">
            {description}
          </FormDescription>
        </FormItem>
      )}
    />
  );
};

export default AccountReusableInput;
