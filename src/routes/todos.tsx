import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/todos')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/todos"!</div>
}
