import FooterButtons from '@/components/footer-buttons'
import HeadTitle from '@/components/head-title'
import { useNavigate } from '@tanstack/react-router'
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Controller, useForm } from "react-hook-form";
import { Checkbox } from '@/components/ui/checkbox';
import useSessionStorage from '@/hooks/use-session-storage';
import { SESSION_KEYS } from '@/constants';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';


export const formSchema = z.object({
  paymentMethod: z.string().default('visa'),
  cardNumber: z.string().min(1, 'Card Number is required'),
  nameOnCard: z.string().min(1, 'Name is required'),
  cardExpiryDate: z.string().min(1, 'Expiry Date is required'),
  cvv: z.string().min(1, 'CVV is required'),
  paymentAuthorization: z.boolean().refine(val => val === true, {
    message: 'You must authorize your account.'
  }),
});

// TypeScript Types (inferred from Zod schema)
export type FormSchema = z.infer<typeof formSchema>;

export default function PaymentRouteComponent() {

  const navigate = useNavigate();
  const [paymentInformation, setPaymentInformation] = useSessionStorage<FormSchema | null>(
    SESSION_KEYS.PAYMENT_KEY,
    null
  );

  const defaultFormValues: Partial<FormSchema> = {
    paymentMethod: 'visa',
    cardNumber: '',
    nameOnCard: '',
    cardExpiryDate: '',
    cvv: '',
    paymentAuthorization: false
  }

  const methods = useForm<FormSchema>({
    resolver: zodResolver(formSchema as any),
    defaultValues: paymentInformation || defaultFormValues,
    // mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = (data: any) => {
    setPaymentInformation(data);
    navigate({ to: "/acknowledgements" });
  };

  const paymentMethods = [
    {
      id: 'visa',
      name: 'Visa'
    },
    {
      id: 'mastercard',
      name: 'Master Card'
    },
    {
      id: 'amex',
      name: 'American Express'
    },
    {
      id: 'bank_transfer',
      name: 'E-Transfer'
    }
  ];

  return <div>
    <form onSubmit={methods.handleSubmit(onSubmit)} className='px-1'>
      <div>
        <HeadTitle
          title={`Payment Information`}
          description={`How do you want to pay for your medications?`}
        >
          <p className='text-base font-medium text-foreground/80'>Please select one payment method. All orders must be paid in full prior to shipment. Payment will be charged at the time of order processing.</p>
        </HeadTitle>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-4">
        {paymentMethods.map((method) => {
          const selectedPaymentMethod = methods.watch('paymentMethod')
          return (
            <div
              key={method.id}
              onClick={() => methods.setValue('paymentMethod', method.id)}
              className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${selectedPaymentMethod === method.id
                ? 'border-theme-green'
                : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <div className="flex items-center gap-4">
                {/* Radio Button */}
                <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center 
                ${selectedPaymentMethod === method.id
                    ? 'border-theme-green bg-white'
                    : 'border-gray-300 bg-white'
                  }`}>
                  {selectedPaymentMethod === method.id && (
                    <div className="w-3 h-3 rounded-full bg-theme-green"></div>
                  )}
                </div>

                {/* Location Details */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{method.name}</h3>
                </div>

              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        <Controller
          name="cardNumber"
          control={methods.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="card-number" className="text-xl">
                {`Card Number`}<span className="text-destructive">{`*`}</span>
              </FieldLabel>
              <Input
                {...field}
                id="card-number"
                aria-invalid={fieldState.invalid}
                placeholder=""
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
          name="nameOnCard"
          control={methods.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="name-on-card" className="text-xl">
                {`Name as per Card`}<span className="text-destructive">{`*`}</span>
              </FieldLabel>
              <Input
                {...field}
                id="name-on-card"
                aria-invalid={fieldState.invalid}
                placeholder=""
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
          name="cardExpiryDate"
          control={methods.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="card-expiry-date" className="text-xl">
                {`Exp. Date`}<span className="text-destructive">{`*`}</span>
              </FieldLabel>
              <Input
                {...field}
                id="card-expiry-date"
                aria-invalid={fieldState.invalid}
                placeholder=""
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
          name="cvv"
          control={methods.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="cvv-field" className="text-xl">
                {`CVV`}<span className="text-destructive">{`*`}</span>
              </FieldLabel>
              <Input
                {...field}
                id="cvv-field"
                aria-invalid={fieldState.invalid}
                placeholder=""
                autoComplete="off"
                className={cn("h-12 md:text-lg")}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div >

      <div className='mt-5'>
        <Controller
          name="paymentAuthorization"
          control={methods.control}
          render={({ field, fieldState }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="payment-authorization"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <FieldLabel
                htmlFor="payment-authorization"
                className={cn("font-normal text-lg", fieldState.invalid && 'text-destructive')}
              >
                I authorize Pace Pharmacy to charge my card for prescription medications and services as ordered.
              </FieldLabel>
            </Field>
          )}
        />
      </div>

      <FooterButtons
        showBackButton
        backButtonPath='/account'
        onSubmit={methods.handleSubmit(onSubmit)} />

    </form >
  </div >
}