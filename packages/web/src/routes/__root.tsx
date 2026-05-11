import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';

import appCss from '../styles.css?url';
import { ErrorBoundary } from '#/components/error-boundary';
import { ThemeProvider } from '#/components/theme-provider';
import { ThemeToggle } from '#/components/theme-toggle';
import { Button } from '#/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';

const themeInitScript = `(function(){try{var s=localStorage.getItem('theme');var t=(s==='dark'||s==='light')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.add(t);}catch(e){}})();`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
    <ThemeProvider>
      <div className="mx-auto max-w-3xl p-6">
        <nav className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
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
            <Button asChild variant="ghost" size="sm">
              <Link to="/users" className="[&.active]:font-bold">
                Users
              </Link>
            </Button>
          </div>
          <ThemeToggle />
        </nav>
        <Outlet />
      </div>
    </ThemeProvider>
  );
}
