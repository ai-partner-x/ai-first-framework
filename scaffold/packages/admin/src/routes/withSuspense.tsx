import React, { Suspense, createElement } from "react"

// eslint-disable-next-line react-refresh/only-export-components
const DefaultRouteFallback: React.FC = () => (
  <div className="flex h-full w-full items-center justify-center">
    <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
)

/** Wrap a component in <Suspense> and return an element, for route elements. */
export function withSuspense(
  Comp: React.ComponentType,
  fallback: React.ReactNode = <DefaultRouteFallback />,
) {
  return createElement(
    Suspense,
    { fallback },
    createElement(Comp),
  )
}

