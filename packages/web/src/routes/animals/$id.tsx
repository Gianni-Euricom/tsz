import { useState } from 'react';
import { createFileRoute, Link, notFound, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Pencil } from 'lucide-react';
import { z } from 'zod';
import { getAnimalById, updateAnimal, type AnimalDTO } from '#/api/animals';
import { Alert, AlertDescription } from '#/components/ui/alert';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';

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

      <Card>
        <CardContent>
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
        </CardContent>
      </Card>
    </main>
  );
}

function ReadView({ animal, onEdit }: { animal: AnimalDTO; onEdit: () => void }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{animal.name}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">#{animal.id}</span>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Species</dt>
          <dd className="mt-1 text-foreground">{animal.species}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Age</dt>
          <dd className="mt-1 text-foreground">{animal.age} years</dd>
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
        <span className="text-sm text-muted-foreground">#{animal.id}</span>
      </div>

      <div className="mt-6 grid gap-4 border-t pt-6">
        <div className="grid gap-2">
          <Label htmlFor="animal-name">Name</Label>
          <Input
            id="animal-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="animal-species">Species</Label>
          <Input
            id="animal-species"
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="animal-age">Age</Label>
          <Input
            id="animal-age"
            type="number"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            required
            min={0}
            max={200}
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
