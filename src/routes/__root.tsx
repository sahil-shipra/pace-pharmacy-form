import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <section className="">
        <div className="py-8 px-4 mx-auto max-w-7xl lg:py-16 lg:px-6">
          <div className="mx-auto max-w-screen-sm text-center">
            <h1 className="mb-4 text-5xl sm:text-7xl lg:text-9xl tracking-tight font-extrabold text-primary-600 dark:text-primary-500">404</h1>
            <p className="mb-4 text-2xl sm:text-3xl md:text-4xl tracking-tight font-bold text-gray-900 dark:text-white">Something's missing.</p>
            <p className="mb-4 text-base sm:text-lg font-light text-gray-500 dark:text-gray-400">Sorry, we can't find that page. You'll find lots to explore on the home page. </p>
          </div>
        </div>
      </section>
    );
  },
});

// Create a client
const queryClient = new QueryClient();

function RootComponent() {
  return (
    <Fragment>
      <QueryClientProvider client={queryClient}>
        <div className="relative bg-section min-h-dvh font-enzyme">
          <div className="py-1.5 bg-white shadow">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-3 sm:gap-0">
                <div className="shrink-0">
                  <img src="/logo.png" alt="logo" className="h-20 sm:h-auto max-w-fit sm:max-w-none" />
                </div>
                <div className="text-center sm:text-right">
                  <h1 className="font-medium text-xl sm:text-2xl md:text-[32px] leading-tight sm:leading-[40px]">
                    New Account Setup
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <Outlet />
        </div>
        <Toaster position="top-center" />
      </QueryClientProvider>
    </Fragment>
  );
}
