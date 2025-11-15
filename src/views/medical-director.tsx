import FooterButtons from '@/components/footer-buttons'
import HeadTitle from '@/components/head-title'
import { useNavigate } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import useSessionStorage from '@/hooks/use-session-storage'
import z from 'zod'
import { SESSION_KEYS } from '@/constants'
import { zodResolver } from '@hookform/resolvers/zod'
import { Fragment } from 'react/jsx-runtime'

const formSchema = z.object({
  isAlsoMedicalDirector: z.boolean().optional().default(false),
  name: z.string().min(1, 'Name is required'),
  licenseNo: z.string().optional().default(''),
  email: z.string().optional().default(''),
}).refine(
  (data) => {
    if (data.isAlsoMedicalDirector === false) {
      return data.email && data.email.length > 0 && z.string().email().safeParse(data.email).success;
    }
    return true;
  },
  {
    message: 'Valid email is required',
    path: ['email'],
  }
);
// TypeScript Types (inferred from Zod schema)
export type FormSchema = z.infer<typeof formSchema>;

function MedicalRouteComponent() {
  const navigate = useNavigate();
  const [paymentInformation, setPaymentInformation] = useSessionStorage<FormSchema | null>(
    SESSION_KEYS.MEDICAL_DIRECTOR_KEY,
    null
  );

  const defaultFormValues: Partial<FormSchema> = {
    isAlsoMedicalDirector: false,
    name: '',
    licenseNo: ''
  }

  const methods = useForm<FormSchema>({
    resolver: zodResolver(formSchema as any),
    defaultValues: paymentInformation || defaultFormValues,
    mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = (data: any) => {
    setPaymentInformation(data);
    navigate({ to: "/review" });
  };

  const isAlsoMedicalDirector = methods.watch('isAlsoMedicalDirector');

  return (
    <div>
      <form onSubmit={methods.handleSubmit(onSubmit)} className='px-1'>
        <div>
          <HeadTitle
            title={`Medical Director Information`}
          />
        </div>

        <div className='space-y-5 mt-4'>
          <Controller
            name="isAlsoMedicalDirector"
            control={methods.control}
            render={({ field, fieldState }) => (
              <Field orientation="horizontal">
                <Checkbox
                  id="is-medical-director"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel
                  htmlFor="is-medical-director"
                  className="font-normal text-lg"
                  aria-invalid={fieldState.invalid}
                >
                  I am also the Medical Director (skip authorization steps). Check this box if you are both the account holder and medical director.
                </FieldLabel>
              </Field>
            )}
          />

          <div className="p-4 mb-4 text-theme-green rounded-lg bg-theme-green-50 text-lg" role="alert">
            {isAlsoMedicalDirector ?
              <Fragment>
                <strong>Single Person Application : </strong>
                Since you are both the account holder and medical director, You'll complete the authorization in the next step without needing
                separate link or code.
              </Fragment>
              :
              <Fragment>
                <strong>{`Next Step: Your Medical Director will need to complete their authorization section. You can either:`}</strong>
                <ol className="list-disc list-inside space-y-0.5 mt-2 text-theme-green leading-tight text-base">
                  <li>Provide their email to receive an authorization link automatically, or</li>
                  <li>Get a reference code to share with them manually</li>
                </ol>
              </Fragment>
            }
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Controller
              name="name"
              control={methods.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel htmlFor="medical-director-name" className="text-xl">
                    {`Medical Director's Name`}<span className="text-destructive">{`*`}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="medical-director-name"
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
              name="licenseNo"
              control={methods.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel htmlFor="medical-director-license" className="text-xl">
                    {`Medical Director's License #`}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="medical-director-license"
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
          </div>

          {!isAlsoMedicalDirector && (
            <Controller
              name="email"
              control={methods.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-0">
                  <FieldLabel htmlFor="medical-director-email" className="text-xl">
                    {`Medical Director's Email (An authorization link will be sent to this email address)*`}
                    <span className="text-destructive">{`*`}</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="medical-director-email"
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
          )}
        </div>

        <FooterButtons
          showBackButton
          backButtonPath='/acknowledgements'
        />
      </form>
    </div>
  );
}

export default MedicalRouteComponent