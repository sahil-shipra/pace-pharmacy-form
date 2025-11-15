import MedicalRouteComponent from '@/views/medical-director'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_form/medical-director')({
  component: MedicalRouteComponent,
})