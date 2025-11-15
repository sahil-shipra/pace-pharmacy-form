import PaymentRouteComponent from '@/views/payment'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_form/payment')({
  component: PaymentRouteComponent,
})