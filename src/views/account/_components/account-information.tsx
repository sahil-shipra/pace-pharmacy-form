import HeadTitle from "@/components/head-title"
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Controller, useFormContext } from "react-hook-form";

function AccountInformation() {
  const form = useFormContext();
  return (
    <div className="pb-5">
      <HeadTitle
        title={`Account Information`}
        description={`Primary account holder details and organization information.`}
      />

      <div className="grid md:grid-cols-2 gap-5 mt-4 px-1">
        <Controller
          name="account.holderName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="account-holder-name" className="text-xl">
                {`Account Holder's Name`}<span className="text-destructive">{`*`}</span>
              </FieldLabel>
              <Input
                {...field}
                id="account-holder-name"
                aria-invalid={fieldState.invalid}
                placeholder="eg., Mark Wood"
                autoComplete="off"
                className="h-12 md:text-lg"
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="account.designation"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="designation" className="text-xl">
                {`Designation/License`}<span className="text-destructive">{`*`}</span>
              </FieldLabel>
              <Input
                {...field}
                id="designation"
                aria-invalid={fieldState.invalid}
                placeholder="eg., Physician"
                autoComplete="off"
                className="h-12 md:text-lg"
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="account.organizationName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="organization-name" className="text-xl">
                {`Clinic / Organization Name`}<span className="text-destructive">{`*`}</span>
              </FieldLabel>
              <Input
                {...field}
                id="organization-name"
                aria-invalid={fieldState.invalid}
                placeholder="eg., Family Health Centre"
                autoComplete="off"
                className="h-12 md:text-lg"
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="account.contactPerson"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="contact-person" className="text-xl">
                {`Contact Person (if different)`}
              </FieldLabel>
              <Input
                {...field}
                id="contact-person"
                aria-invalid={fieldState.invalid}
                placeholder="eg., John Doe"
                autoComplete="off"
                className={cn("h-12 md:text-lg")}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>
    </div>
  )
}

export default AccountInformation