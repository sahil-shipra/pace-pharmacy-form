import { ScrollArea } from '@/components/ui/scroll-area'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Fragment } from 'react/jsx-runtime'

export const Route = createFileRoute('/_account')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Fragment>
    <div className='flex justify-center items-center py-[50px]'>
      <div className='bg-white rounded-2xl p-[50px] container'>
        <div className='flex justify-center items-start gap-5 w-full'>
          <ScrollArea className='w-full max-h-[calc(100dvh-350px)] -mr-14 pr-12'>
            <Outlet />
          </ScrollArea>
        </div>
      </div>
    </div>
  </Fragment>
}
