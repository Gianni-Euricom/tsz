import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getAnimals, type AnimalDTO } from '#/api/animals';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table';

const fetchAnimals = createServerFn({ method: 'GET' }).handler(async () => {
  return await getAnimals();
});

export const Route = createFileRoute('/animals/')({
  beforeLoad: () => {
    throw notFound();
  },
  loader: () => fetchAnimals(),
  component: Animals,
});

function Animals() {
  const animals = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <main>
      <h1 className="text-2xl font-bold">Animals</h1>
      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Species</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {animals.map((animal: AnimalDTO) => (
            <TableRow
              key={animal.id}
              onClick={() => navigate({ to: '/animals/$id', params: { id: String(animal.id) } })}
              className="cursor-pointer"
            >
              <TableCell>{animal.name}</TableCell>
              <TableCell>{animal.species}</TableCell>
              <TableCell>{animal.age}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
