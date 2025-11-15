import HeadTitle from "@/components/head-title";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { Controller, useFormContext } from "react-hook-form";
import type { FormSchema } from "./form-schema";
import InputWithMask from "@/components/input-with-mask";

const provinces = [
  { label: "Alberta", value: "alberta" },
  { label: "British Columbia", value: "british_columbia" },
  { label: "Manitoba", value: "manitoba" },
  { label: "New Brunswick", value: "new_brunswick" },
  { label: "Newfoundland and Labrador", value: "newfoundland_and_labrador" },
  { label: "Nova Scotia", value: "nova_scotia" },
  { label: "Ontario", value: "ontario" },
  { label: "Prince Edward Island", value: "prince_edward_island" },
  { label: "Quebec", value: "quebec" },
  { label: "Saskatchewan", value: "saskatchewan" },
];

const addressFields: Array<keyof FormSchema["billingAddress"]> = [
  "addressLine_1",
  "addressLine_2",
  "city",
  "province",
  "postalCode",
];

function Address() {
  const form = useFormContext<FormSchema>();

  const isSameAsBilling = form.watch("sameAsBilling");
  const billingAddress = form.watch("billingAddress");

  useEffect(() => {
    if (!isSameAsBilling) {
      return;
    }

    form.clearErrors('shippingAddress')
    const currentShipping = form.getValues("shippingAddress");

    const hasDifference = addressFields.some((field) => {
      return billingAddress?.[field] !== currentShipping?.[field];
    });

    if (!hasDifference) {
      return;
    }

    form.setValue(
      "shippingAddress",
      {
        addressLine_1: billingAddress?.addressLine_1 ?? "",
        addressLine_2: billingAddress?.addressLine_2 ?? "",
        city: billingAddress?.city ?? "",
        province: billingAddress?.province ?? "",
        postalCode: billingAddress?.postalCode ?? "",
      },
      {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      }
    );
  }, [isSameAsBilling, billingAddress, form]);

  return (
    <div className="pb-5">
      <div className="block md:flex justify-between items-start gap-4 md:divide-x">
        {/* billing-address */}
        <div className="md:w-1/2 px-1 pr-4">
          <div>
            <HeadTitle
              title={`Billing Address`}
              description={`Invoice and payment correspondence address.`}
            />
          </div>
          <div className="my-1 mb-0"></div>

          <div className="mt-8 space-y-5">
            <Controller
              name="billingAddress.addressLine_1"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel htmlFor="address-line-1" className="text-xl">
                    {`Address Line 1`}
                    <span className="text-destructive">{`*`}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="address-line-1"
                    aria-invalid={fieldState.invalid}
                    placeholder="Street, P.O."
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
              name="billingAddress.addressLine_2"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel htmlFor="address-line-2" className="text-xl">
                    {`Address Line 2`}
                    <span className="text-destructive">{`*`}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="address-line-2"
                    aria-invalid={fieldState.invalid}
                    placeholder="Apartment, Unit, Building, Etc.,"
                    autoComplete="off"
                    className="h-12 md:text-lg"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Controller
                name="billingAddress.city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-0">
                    <FieldLabel htmlFor="city" className="text-xl">
                      {`City`}
                      <span className="text-destructive">{`*`}</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="city"
                      aria-invalid={fieldState.invalid}
                      placeholder="City"
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
                name="billingAddress.province"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-0">
                    <FieldLabel htmlFor="province" className="text-xl">
                      {`Province`}
                      <span className="text-destructive">{`*`}</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        size="default"
                        className={cn("h-12 w-full")}
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem
                            key={province.value}
                            value={province.value}
                          >
                            {province.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="billingAddress.postalCode"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-0">
                    <FieldLabel htmlFor="postal-code" className="text-xl">
                      {`Postal Code`}
                      <span className="text-destructive">{`*`}</span>
                    </FieldLabel>
                    <InputWithMask
                      mask={"*** ***"}
                      definitions={{
                        "*": /[A-Za-z0-9]/,
                      }}
                      field={{ ...field }}
                      fieldState={{ ...fieldState }}
                      id="postal-code"
                      placeholder="Postal Code" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
        </div>
        {/* end billing-address */}

        {/* shipping-address */}
        <div className="md:w-1/2 px-1">
          <div>
            <HeadTitle
              title={`Shipping Address`}
              description={`Physical delivery location for orders and prescriptions.`}
            />
          </div>

          <div className="my-1 mb-0">
            <Controller
              name="sameAsBilling"
              control={form.control}
              render={({ field, fieldState: __ }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="checkout-same-as-shipping"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel
                    htmlFor="checkout-same-as-shipping"
                    className="font-normal text-lg"
                  >
                    Shipping address is the same as billing address
                  </FieldLabel>
                </Field>
              )}
            />
          </div>

          <div className="space-y-5">
            <Controller
              name="shippingAddress.addressLine_1"
              control={form.control}
              disabled={isSameAsBilling}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel
                    htmlFor="shipping-address-address-line-1"
                    className="text-xl"
                  >
                    {`Address Line 1`}
                    <span className="text-destructive">{`*`}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="shipping-address-address-line-1"
                    aria-invalid={fieldState.invalid}
                    placeholder="Street, P.O."
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
              name="shippingAddress.addressLine_2"
              control={form.control}
              disabled={isSameAsBilling}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel
                    htmlFor="shipping-address-address-line-2"
                    className="text-xl"
                  >
                    {`Address Line 2`}
                    <span className="text-destructive">{`*`}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="shipping-address-address-line-2"
                    aria-invalid={fieldState.invalid}
                    placeholder="Apartment, Unit, Building, Etc.,"
                    autoComplete="off"
                    className="h-12 md:text-lg"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Controller
                name="shippingAddress.city"
                control={form.control}
                disabled={isSameAsBilling}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-0">
                    <FieldLabel
                      htmlFor="shipping-address-city"
                      className="text-xl"
                    >
                      {`City`}
                      <span className="text-destructive">{`*`}</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="shipping-address-city"
                      aria-invalid={fieldState.invalid}
                      placeholder="City"
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
                name="shippingAddress.province"
                control={form.control}
                disabled={isSameAsBilling}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-0">
                    <FieldLabel
                      htmlFor="shipping-address-province"
                      className="text-xl"
                    >
                      {`Province`}
                      <span className="text-destructive">{`*`}</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        size="default"
                        className={cn("h-12 w-full")}
                        aria-invalid={fieldState.invalid}
                        id="shipping-address-province"
                        disabled={field.disabled}
                      >
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem
                            key={province.value}
                            value={province.value}
                          >
                            {province.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="shippingAddress.postalCode"
                control={form.control}
                disabled={isSameAsBilling}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-0">
                    <FieldLabel
                      htmlFor="shipping-address-postal-code"
                      className="text-xl"
                    >
                      {`Postal Code`}
                      <span className="text-destructive">{`*`}</span>
                    </FieldLabel>
                    <InputWithMask
                      mask={"*** ***"}
                      definitions={{
                        "*": /[A-Za-z0-9]/,
                      }}
                      field={{ ...field }}
                      fieldState={{ ...fieldState }}
                      id="postal-code"
                      placeholder="Postal Code" />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
        </div>
        {/* end shipping-address */}
      </div>

      <div className="mt-5 px-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-0">
                <FieldLabel htmlFor="Phone" className="text-xl">
                  {`Phone`}
                  <span className="text-destructive">{`*`}</span>
                </FieldLabel>

                <InputWithMask field={{ ...field }} fieldState={{ ...fieldState }} id="Phone" />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="emailAddress"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-0">
                <FieldLabel htmlFor="emailAddress" className="text-xl">
                  {`Email Address`}
                  <span className="text-destructive">{`*`}</span>
                </FieldLabel>
                <Input
                  {...field}
                  id="emailAddress"
                  aria-invalid={fieldState.invalid}
                  placeholder="Email"
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
            name="fax"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-0">
                <FieldLabel htmlFor="Fax" className="text-xl">
                  {`Fax (Optional)`}
                </FieldLabel>
                <InputWithMask field={{ ...field }} fieldState={{ ...fieldState }} id="Fax" placeholder="Fax" />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default Address;
