import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getAnimals, type AnimalDTO } from '#/api/animals';

const fetchAnimals = createServerFn({ method: 'GET' }).handler(async () => {
  const { data } = await getAnimals();
  return data ?? [];
});

export const Route = createFileRoute('/animals/')({
  loader: () => fetchAnimals(),
  component: Animals,
});

function Animals() {
  const animals = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <main>
      <h1 className="text-2xl font-bold">Animals</h1>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="pb-2 font-semibold">Name</th>
            <th className="pb-2 font-semibold">Species</th>
            <th className="pb-2 font-semibold">Age</th>
          </tr>
        </thead>
        <tbody>
          {animals.map((animal: AnimalDTO) => (
            <tr
              key={animal.id}
              onClick={() => navigate({ to: '/animals/$id', params: { id: String(animal.id) } })}
              className="cursor-pointer border-b last:border-0 hover:bg-gray-50"
            >
              <td className="py-2">{animal.name}</td>
              <td className="py-2">{animal.species}</td>
              <td className="py-2">{animal.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
