import SideBar from '@/components/sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Fragment } from 'react/jsx-runtime'

export const Route = createFileRoute('/_form')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Fragment>
    <div className='flex justify-center items-center py-4 sm:py-8 md:py-[50px] px-4 sm:px-6'>
      <div className='bg-white rounded-2xl p-4 sm:p-6 md:p-[50px] container w-full max-w-7xl'>
        <div className='flex flex-col lg:flex-row justify-center items-start gap-5 w-full'>
          <div className='w-full lg:w-1/6 lg:sticky lg:top-4'>
            <SideBar />
          </div>
          <ScrollArea className='w-full lg:w-5/6 h-auto lg:h-[calc(100dvh-350px)] mr-0 lg:-mr-14 pr-0 lg:pr-12'>
            <Outlet />
          </ScrollArea>
        </div>
      </div>
    </div>
  </Fragment>
}
