import FooterButtons from '@/components/footer-buttons'
import { useNavigate } from '@tanstack/react-router'
import { Fragment, useEffect } from 'react'
import AccountInformation from './_components/account-information'
import Address from './_components/address'
import Documents from './_components/documents'
import Delivery from './_components/delivery'
import { useForm, FormProvider } from 'react-hook-form'
import { defaultFormValues, formSchema, type FormSchema } from './_components/form-schema'
import { zodResolver } from "@hookform/resolvers/zod"
import useSessionStorage from '@/hooks/use-session-storage'
import { SESSION_KEYS } from '@/constants'
import useDocumentsStore from './_components/documents-store'
import { toast } from 'sonner'

function AccountRouteComponent() {
  const navigate = useNavigate();
  const { documents } = useDocumentsStore();
  const [accountInformation, setAccountInformation] = useSessionStorage<FormSchema | null>(
    SESSION_KEYS.ACCOUNT_KEY,
    null
  );

  const methods = useForm<FormSchema>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      ...(accountInformation || defaultFormValues),
      // Files are not serializable — always seed from Zustand
      documents,
    },
  });

  useEffect(() => {
    methods.setValue('documents', documents, {
      shouldValidate: documents.length > 0,
    });
  }, [documents, methods]);

  useEffect(() => {
    // Session may restore account fields after refresh while uploads are gone
    if (accountInformation && documents.length === 0) {
      toast.warning(
        'Your uploaded documents were cleared. Please upload your license documents again.',
        { className: 'border border-amber-500 text-amber-800' }
      );
    }
    // Only on mount / first visit to this step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (data: FormSchema) => {
    if (!documents.length) {
      methods.setError('documents', {
        type: 'manual',
        message: 'Upload at least one document',
      });
      toast.error(
        'Please upload at least one license document before continuing.',
        { className: 'border border-red-500 text-red-600' }
      );
      return;
    }

    setAccountInformation({
      ...data,
      // Do not persist File objects in sessionStorage
      documents: [],
      account: {
        ...data.account,
        holderName: `${data.account.firstName} ${data.account.lastName}`,
      },
    });
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