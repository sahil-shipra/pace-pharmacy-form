import { createFileRoute, Navigate, useSearch } from '@tanstack/react-router'

export const Route = createFileRoute('/_account/account-setup/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { code }: { code: string } = useSearch({ from: '/_account/account-setup/' })
  if (!code) return (<Navigate to={'/location'} />)
  return <Navigate to={'/account-setup/$code'} params={{ code: code }} />
}
