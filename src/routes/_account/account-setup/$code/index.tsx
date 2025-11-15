import AccountSetupRouteComponent from '@/views/account-setup'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_account/account-setup/$code/')({
  component: AccountSetupRouteComponent,
})