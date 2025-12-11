import useSessionStorage from '@/hooks/use-session-storage';
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { Fragment } from 'react/jsx-runtime'

export const Route = createFileRoute('/_account/account-setup/$code/submitted')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  const [isSubmitted] = useSessionStorage<boolean | null>(
    'AuthorizationSubmitted',
    null
  );
  if (!isSubmitted) return <Navigate to='/' />;
  return <Fragment>
    <div className='flex justify-center items-center py-[50px]'>
      <div className='bg-white rounded-2xl p-[50px] container'>
        <div className='flex justify-center items-start gap-5 w-full'>
          <div>
            <div className='size-36 flex justify-center items-center relative w-full mt-4'>
              <div className='size-20 bg-theme-green rounded-full animate-ping  absolute' />
              <div className='size-16 z-10 rounded-full flex justify-center items-center'>
                <Check className="size-12 text-theme-green" />
              </div>
            </div>

            <div className='text-center space-y-2 max-w-2xl'>
              <h1 className='text-[32px] leading-[40px] font-bold text-theme-green'>Authorization Submitted Successfully !</h1>
              <p className='text-lg font-medium text-foreground/80'>Thank you for completing the Medical Direction authorization.</p>

              <p className='text-lg font-medium text-foreground/80'>
                The complete application has been submitted to Pace Pharmacy for review.
                <br />
                Both you and the account holder will receive a confirmation email.
              </p>
            </div>
          </div>
          {/* </ScrollArea> */}
        </div>
      </div>
    </div>
  </Fragment>
}
