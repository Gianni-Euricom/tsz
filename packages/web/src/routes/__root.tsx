import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';

import appCss from '../styles.css?url';
import { ErrorBoundary } from '#/components/error-boundary';
import { Button } from '#/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'TanStack Start' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
  errorComponent: ErrorBoundary,
  notFoundComponent: () => (
    <main>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Page not found</CardTitle>
          <CardDescription>The page you're looking for doesn't exist.</CardDescription>
        </CardHeader>
      </Card>
    </main>
  ),
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <nav className="mb-6 flex gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/" className="[&.active]:font-bold">
            Home
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link to="/animals" className="[&.active]:font-bold">
            Animals
          </Link>
        </Button>
      </nav>
      <Outlet />
    </div>
  );
}
