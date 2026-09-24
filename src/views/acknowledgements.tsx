import FooterButtons from '@/components/footer-buttons'
import HeadTitle from '@/components/head-title'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SESSION_KEYS } from '@/constants'
import useSessionStorage from '@/hooks/use-session-storage'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

export const formSchema = z.object({
  // Cardholder acknowledgement
  cardholderName: z.string().min(1, 'Cardholder name is required'),
  cardholderConsent: z.boolean().refine(val => val === true, {
    message: 'You must authorize your account as cardholder.'
  }),
  // Account holder acknowledgement
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  accountHolderConsent: z.boolean().refine(val => val === true, {
    message: 'You must authorize your account as account holder.'
  }),
});

// TypeScript Types (inferred from Zod schema)
export type FormSchema = z.infer<typeof formSchema>;

function AckRouteComponent() {
  const navigate = useNavigate();
  const [acknowledgements, setAcknowledgements] = useSessionStorage<FormSchema | null>(
    SESSION_KEYS.ACK_KEY,
    null
  );

  const defaultFormValues: Partial<FormSchema> = {
    cardholderName: '',
    cardholderConsent: false,
    accountHolderName: '',
    accountHolderConsent: false,
  }

  const methods = useForm<FormSchema>({
    resolver: zodResolver(formSchema as any),
    defaultValues: acknowledgements || defaultFormValues,
  });

  const onSubmit = (data: any) => {
    setAcknowledgements(data);
    navigate({ to: "/medical-director" });
  };

  return (
    <div>
      <form onSubmit={methods.handleSubmit(onSubmit)} className='px-1'>

        <div>
          <HeadTitle
            title={`Financial Responsibility & Acknowledgements`}
          />
        </div>

        {/* ── Cardholder Acknowledgement ── */}
        <div className='mt-6'>
          <h2 className='text-xl font-semibold text-theme-green mb-3'>Cardholder Acknowledgement</h2>
          <div className='space-y-5'>
            <p className='text-base font-medium text-foreground/80'>
              {'I am financially responsible for all purchases made on this account. I will keep it current and agree to maintain the account in good standing. I acknowledge that a late fee will apply to late payments, and a restocking fee to orders never picked up.'}
            </p>

            <Controller
              name="cardholderName"
              control={methods.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel htmlFor="cardholder-name" className="text-xl">
                    {`Type Your Name to Acknowledge`}<span className="text-destructive">{`*`}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="cardholder-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="eg., John Mark"
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
              name="cardholderConsent"
              control={methods.control}
              render={({ field, fieldState }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="cardholder-consent"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel
                    htmlFor="cardholder-consent"
                    className={cn("font-normal text-lg", fieldState.invalid && 'text-destructive')}
                  >
                    I authorize Pace Pharmacy to process my account according to the terms above and confirm that I have read and understand all acknowledgements.
                  </FieldLabel>
                </Field>
              )}
            />
          </div>
        </div>

        {/* ── Account Holder Acknowledgement ── */}
        <div className='mt-8'>
          <h2 className='text-xl font-semibold text-theme-green mb-3'>Account Holder Acknowledgement</h2>
          <div className='space-y-5'>
            <div>
              <p className='text-base font-medium text-foreground'>I acknowledge all of the following :</p>
              <ol className="list-decimal list-inside space-y-2 mt-2 text-foreground/80 leading-relaxed text-base">
                <li>All medications supplied to the clinic/organization will be used within an established patient healthcare professional relationship. An appropriately authorized healthcare professional will assess and document the clinical appropriateness of each medication for each patient before administering or dispensing.</li>
                <li>Pace Pharmacy is a compounding pharmacy and is not a drug manufacturer. Compounded medications will only be supplied within an established and valid patient-healthcare professional relationship and will not be resold or distributed to third parties.</li>
                <li>Pace Pharmacy is available to provide medication information and patient counselling services.</li>
              </ol>
            </div>

            <Controller
              name="accountHolderName"
              control={methods.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel htmlFor="account-holder-name-ack" className="text-xl">
                    {`Type Your Name to Acknowledge`}<span className="text-destructive">{`*`}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="account-holder-name-ack"
                    aria-invalid={fieldState.invalid}
                    placeholder="eg., John Mark"
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
              name="accountHolderConsent"
              control={methods.control}
              render={({ field, fieldState }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="account-holder-consent"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel
                    htmlFor="account-holder-consent"
                    className={cn("font-normal text-lg", fieldState.invalid && 'text-destructive')}
                  >
                    I authorize Pace Pharmacy to process my account according to the terms above and confirm that I have read and understand all acknowledgements.
                  </FieldLabel>
                </Field>
              )}
            />
          </div>
        </div>

        <FooterButtons
          showBackButton
          backButtonPath='/payment'
        />
      </form>
    </div>
  )
}

export default AckRouteComponent
