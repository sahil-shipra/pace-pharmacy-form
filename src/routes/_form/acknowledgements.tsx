import AckRouteComponent from '@/views/acknowledgements'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_form/acknowledgements')({
  component: AckRouteComponent,
})