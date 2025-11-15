import { ScrollArea } from '@/components/ui/scroll-area'
import useSessionStorage from '@/hooks/use-session-storage'
import { createFileRoute, Navigate, useSearch } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { Fragment } from 'react/jsx-runtime'

export const Route = createFileRoute('/submitted')({
  component: RouteComponent,
})

function RouteComponent() {
  const { code }: { code?: string } = useSearch({ from: '/submitted' })
  const [sessioncode] = useSessionStorage<string | null>(
    'referenceCode',
    null
  );
  
  // Redirect if code or sessioncode is missing, or if they don't match
  if (!code || !sessioncode || code !== sessioncode) {
    return <Navigate to='/location' />
  }
  
  // Use the matching code
  const referenceCode = code;

  return <Fragment>
    <div className='flex justify-center items-center py-[50px]'>
      <div className='bg-white rounded-2xl p-[50px] container'>
        <div className='flex justify-center items-start gap-5 w-full'>
          <ScrollArea className='w-full h-[calc(100dvh-350px)] -mr-14 pr-12'>
            <div className='size-36 flex justify-center items-center relative w-full mt-4'>
              <div className='size-20 bg-theme-green rounded-full animate-ping  absolute' />
              <div className='size-16 z-10 rounded-full flex justify-center items-center'>
                <Check className="size-12 text-theme-green" />
              </div>
            </div>

            <div className='text-center space-y-2'>
              <h1 className='text-[32px] leading-[40px] font-bold text-theme-green'>Application Submitted Successfully !</h1>
              <p className='text-base font-medium text-foreground/80'>Your Professional account application has been submitted to Pace Pharmacy.</p>
              {referenceCode && <p className='text-lg font-medium text-foreground/80'>
                <strong className='text-foreground'>Application Reference Code : </strong>
                <span className='font-bold underline text-theme-green'>{referenceCode}</span>
              </p>}

              <div className="p-4 mb-4 text-theme-green rounded-lg bg-theme-green-50 text-lg max-w-3xl mx-auto" role="alert">
                <strong>{`What's Next :`}</strong>
                <ol className="list-disc list-inside space-y-0.5 mt-2 text-theme-green leading-tight text-base">
                  <li>Our team will review your application (typically 1-2 business days).</li>
                  <li>You will receive an email confirmation, Once your account is activated.</li>
                  <li>Upon activation, you can begin placing orders.</li>
                </ol>
              </div>

            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  </Fragment>
}
