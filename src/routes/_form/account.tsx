import AccountRouteComponent from '@/views/account'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_form/account')({
  component: AccountRouteComponent,
})