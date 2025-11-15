import FooterButtons from '@/components/footer-buttons'
import { useNavigate } from '@tanstack/react-router'
import { Fragment } from 'react/jsx-runtime'
import AccountInformation from './_components/account-information'
import Address from './_components/address'
import Documents from './_components/documents'
import Delivery from './_components/delivery'
import { useForm, FormProvider } from 'react-hook-form'
import { defaultFormValues, formSchema, type FormSchema } from './_components/form-schema'
import { zodResolver } from "@hookform/resolvers/zod"
import useSessionStorage from '@/hooks/use-session-storage'
import { SESSION_KEYS } from '@/constants'

function AccountRouteComponent() {
  const navigate = useNavigate();
  const [accountInformation, setAccountInformation] = useSessionStorage<FormSchema | null>(
    SESSION_KEYS.ACCOUNT_KEY,
    null
  );

  const methods = useForm<FormSchema>({
    resolver: zodResolver(formSchema as any),
    defaultValues: accountInformation || defaultFormValues,
    // mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = (data: FormSchema) => {
    setAccountInformation(data);
    navigate({ to: "/payment" });
  };

  return <Fragment>
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <div className='space-y-5 divide-y'>
          <AccountInformation />
          <Address />
          <Documents />
          <Delivery />
        </div>

        <FooterButtons
          showBackButton
          backButtonPath='/location'
          // nextButtonPath={"/payment"}
          onSubmit={() => null}
        />

      </form>
    </FormProvider>


  </Fragment>
}


export default AccountRouteComponent;