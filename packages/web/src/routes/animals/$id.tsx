import { useState } from 'react';
import { createFileRoute, Link, notFound, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Pencil } from 'lucide-react';
import { z } from 'zod';
import { getAnimalById, updateAnimal, type AnimalDTO } from '#/api/animals';
import { Button } from '#/components/ui/button';

const fetchAnimal = createServerFn({ method: 'GET' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    const { data, error } = await getAnimalById(id);
    if (error || !data) throw notFound();
    return data;
  });

const updateAnimalSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  species: z.string().min(1).max(100),
  age: z.number().int().min(0).max(200),
});

const saveAnimal = createServerFn({ method: 'POST' })
  .inputValidator(updateAnimalSchema)
  .handler(async ({ data }) => {
    const { id, ...payload } = data;
    const { data: animal, error } = await updateAnimal(id, payload);
    if (error || !animal) throw new Error('Failed to update animal');
    return animal;
  });

export const Route = createFileRoute('/animals/$id')({
  loader: ({ params }) => fetchAnimal({ data: Number(params.id) }),
  component: AnimalDetail,
});

function AnimalDetail() {
  const animal = Route.useLoaderData();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <main className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link to="/animals">
          <ArrowLeft />
          Back to animals
        </Link>
      </Button>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {isEditing ? (
          <EditForm
            animal={animal}
            onCancel={() => setIsEditing(false)}
            onSaved={async () => {
              await router.invalidate();
              setIsEditing(false);
            }}
          />
        ) : (
          <ReadView animal={animal} onEdit={() => setIsEditing(true)} />
        )}
      </div>
    </main>
  );
}

function ReadView({ animal, onEdit }: { animal: AnimalDTO; onEdit: () => void }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">#{animal.id}</span>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
        </div>
      </div>

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
    </>
  );
}

function EditForm({
  animal,
  onCancel,
  onSaved,
}: {
  animal: AnimalDTO;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [name, setName] = useState(animal.name);
  const [species, setSpecies] = useState(animal.species);
  const [age, setAge] = useState(animal.age);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveAnimal({ data: { id: animal.id, name, species, age } });
      await onSaved();
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Edit animal</h1>
        <span className="text-sm text-gray-500">#{animal.id}</span>
      </div>

      <div className="mt-6 grid gap-4 border-t pt-6 text-sm">
        <Field label="Name">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
          />
        </Field>
        <Field label="Species">
          <input
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            required
            maxLength={100}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
          />
        </Field>
        <Field label="Age">
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            required
            min={0}
            max={200}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-gray-900 focus:outline-none"
          />
        </Field>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-medium text-gray-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
