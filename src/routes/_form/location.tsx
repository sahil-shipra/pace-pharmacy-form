import LocationComponent from '@/views/location'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_form/location')({
  component: LocationComponent,
})