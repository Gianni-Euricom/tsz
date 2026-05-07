import { createFileRoute } from '@tanstack/react-router';
import { Card, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>A simple TanStack Start app.</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
