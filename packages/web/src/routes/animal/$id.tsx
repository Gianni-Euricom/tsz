import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { getAnimalById } from '#/api/animals';
import { Button } from '#/components/ui/button';

export const Route = createFileRoute('/animal/$id')({
  loader: async ({ params }) => {
    const { data, error } = await getAnimalById(Number(params.id));
    if (error || !data) throw notFound();
    return data;
  },
  component: AnimalDetail,
});

function AnimalDetail() {
  const animal = Route.useLoaderData();

  return (
    <main className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link to="/animals">
          <ArrowLeft />
          Back to animals
        </Link>
      </Button>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>
          <span className="text-sm text-gray-500">#{animal.id}</span>
        </div>
        <p className="mt-1 text-gray-600">{animal.species}</p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Species</dt>
            <dd className="mt-1 text-gray-900">{animal.species}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Age</dt>
            <dd className="mt-1 text-gray-900">{animal.age} years</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
