import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import './index.css'
// Import the generated route tree
import { routeTree } from './routeTree.gen'
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://d7c1fd399d3be7d384415c5495545d11@o4511936472088576.ingest.us.sentry.io/4511936484933632",
  sendDefaultPii: false,
  dataCollection: {
    // Avoid capturing user PII / HTTP bodies (account + payment FormData).
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
    userInfo: false,
    httpBodies: [],
  },
  beforeSend(event) {
    // Extra guard: strip request payloads that may contain form/PII data.
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
    }
    return event;
  },
});

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}