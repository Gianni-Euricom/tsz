import { useEffect } from 'react';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert';
import { Button } from '#/components/ui/button';

function formatError(error: unknown): {
  name: string;
  message: string;
  stack?: string;
  raw: unknown;
} {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack, raw: error };
  }
  if (typeof error === 'string') {
    return { name: 'Error', message: error, raw: error };
  }
  try {
    return { name: 'Error', message: JSON.stringify(error), raw: error };
  } catch {
    return { name: 'Error', message: String(error), raw: error };
  }
}

export function ErrorBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const info = formatError(error);

  useEffect(() => {
    console.group(`[ErrorBoundary] ${info.name}: ${info.message}`);
    console.error(info.raw);
    if (info.stack) console.error(info.stack);
    console.groupEnd();
  }, [info]);

  return (
    <main className="space-y-4">
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          <span className="font-mono">{info.name}:</span> {info.message}
        </AlertDescription>
      </Alert>
      {import.meta.env.DEV && info.stack ? (
        <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{info.stack}</pre>
      ) : null}
      <div className="flex gap-2">
        <Button
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Try again
        </Button>
        <Button variant="outline" onClick={() => router.navigate({ to: '/' })}>
          Go home
        </Button>
      </div>
    </main>
  );
}
