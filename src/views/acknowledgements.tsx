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
  nameToAcknowledge: z.string().min(1, 'Name is required'),
  acknowledgementConsent: z.boolean().refine(val => val === true, {
    message: 'You must authorize your account.'
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
    nameToAcknowledge: '',
    acknowledgementConsent: false
  }

  const methods = useForm<FormSchema>({
    resolver: zodResolver(formSchema as any),
    defaultValues: acknowledgements || defaultFormValues,
    // mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = (data: any) => {
    setAcknowledgements(data);
    navigate({ to: "/medical-director" });
  };

  return (<div>

    <form onSubmit={methods.handleSubmit(onSubmit)} className='px-1'>

      <div>
        <HeadTitle
          title={`Financial Responsibility & Acknowledgements`}
        />
      </div>
      <div className='mt-4 space-y-5'>
        <p className='text-base font-medium text-foreground/80'>{'I am financially responsible for all purchases made on this account. I will keep it current and agree to maintain the account in good standing. I acknowledge that a late fee will apply to late payments, and a restocking fee to orders never picked up.'}</p>

        <div>
          <p className='text-base font-medium text-foreground'>I acknowledge all of the following :</p>

          <ol className="list-decimal list-inside space-y-0.5 mt-2 text-foreground/80 leading-relaxed text-base">
            <li>Pace Pharmacy is not a manufacturer</li>
            <li>Compounded products are only to be used within an established and valid patient-healthcare professional relationship</li>
            <li>Compounded products may not be sold to a third party</li>
            <li>A healthcare professional must assess and document the clinical appropriateness for every patient</li>
            <li>Pace Pharmacy is available to answer patients' questions and offer counselling on our compounded products</li>
          </ol>

        </div>
      </div>

      <div className='mt-4 space-y-5'>

        <Controller
          name="nameToAcknowledge"
          control={methods.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel htmlFor="name-to-acknowledge" className="text-xl">
                {`Type Your Name to Acknowledge`}<span className="text-destructive">{`*`}</span>
              </FieldLabel>
              <Input
                {...field}
                id="name-to-acknowledge"
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
          name="acknowledgementConsent"
          control={methods.control}
          render={({ field, fieldState }) => (
            <Field orientation="horizontal">
              <Checkbox
                id="acknowledgement-consent"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <FieldLabel
                htmlFor="acknowledgement-consent"
                className={cn("font-normal text-lg", fieldState.invalid && 'text-destructive')}
              >
                I authorize Pace Pharmacy to process my account according to the terms above and confirm that I have read and understand all acknowledgements.
              </FieldLabel>
            </Field>
          )}
        />
      </div>

      <FooterButtons
        showBackButton
        backButtonPath='/payment'
      />
    </form >

  </div >)
}

export default AckRouteComponent