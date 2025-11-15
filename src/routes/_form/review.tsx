import ReviewRouteComponent from '@/views/review'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_form/review')({
  component: ReviewRouteComponent,
})