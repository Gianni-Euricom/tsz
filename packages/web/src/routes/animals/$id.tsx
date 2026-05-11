import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
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

const animalFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  species: z.string().min(1, 'Species is required').max(100),
  age: z.number().int('Age must be a whole number').min(0, 'Age cannot be negative').max(200),
});

const updateAnimalSchema = animalFormSchema.extend({
  id: z.number().int().positive(),
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
  beforeLoad: () => {
    throw notFound();
  },
  loader: ({ params }) => fetchAnimal({ data: Number(params.id) }),
  component: AnimalDetail,
});

function AnimalDetail() {
  const animal = Route.useLoaderData();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  if (!animal) return null;

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

function formatFieldErrors(errors: ReadonlyArray<unknown>): string {
  return errors
    .map((err) => {
      if (!err) return '';
      if (typeof err === 'string') return err;
      if (typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        return err.message;
      }
      return String(err);
    })
    .filter(Boolean)
    .join(', ');
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: animal.name ?? '',
      species: animal.species ?? '',
      age: Number(animal.age) || 0,
    },
    validators: {
      onChange: animalFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        await saveAnimal({ data: { id: Number(animal.id), ...value } });
        await onSaved();
      } catch {
        setSubmitError('Failed to save changes.');
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Edit animal</h1>
        <span className="text-sm text-muted-foreground">#{animal.id}</span>
      </div>

      <div className="mt-6 grid gap-4 border-t pt-6">
        <form.Field
          name="name"
          children={(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Name</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={!field.state.meta.isValid}
                maxLength={100}
              />
              {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive">{formatFieldErrors(field.state.meta.errors)}</p>
              )}
            </div>
          )}
        />
        <form.Field
          name="species"
          children={(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Species</Label>
              <Input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={!field.state.meta.isValid}
                maxLength={100}
              />
              {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive">{formatFieldErrors(field.state.meta.errors)}</p>
              )}
            </div>
          )}
        />
        <form.Field
          name="age"
          children={(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Age</Label>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                aria-invalid={!field.state.meta.isValid}
                min={0}
                max={200}
              />
              {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive">{formatFieldErrors(field.state.meta.errors)}</p>
              )}
            </div>
          )}
        />
      </div>

      {submitError && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        children={([canSubmit, isSubmitting]) => (
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      />
    </form>
  );
}
