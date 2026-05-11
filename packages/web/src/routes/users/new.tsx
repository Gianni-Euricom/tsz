import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { createUser, getRoles, type Role } from '#/api/users';
import { Alert, AlertDescription } from '#/components/ui/alert';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';

const fetchRoles = createServerFn({ method: 'GET' }).handler(async () => {
  return await getRoles();
});

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(200),
  roleIds: z.array(z.string().uuid()).min(1, 'Select at least one role'),
});

const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(createUserSchema)
  .handler(async ({ data }) => {
    return await createUser(data);
  });

export const Route = createFileRoute('/users/new')({
  loader: () => fetchRoles(),
  component: NewUser,
});

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

function NewUser() {
  const roles = Route.useLoaderData();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      roleIds: [] as string[],
    },
    validators: {
      onChange: createUserSchema,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        const created = await createUserFn({ data: value });
        await navigate({ to: '/users/$id', params: { id: created.id } });
      } catch {
        setSubmitError('Failed to create user.');
      }
    },
  });

  return (
    <main className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link to="/users">
          <ArrowLeft />
          Back to users
        </Link>
      </Button>

      <Card>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <h1 className="text-3xl font-bold tracking-tight">New user</h1>

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
                name="email"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={!field.state.meta.isValid}
                      maxLength={200}
                    />
                    {!field.state.meta.isValid && field.state.meta.errors.length > 0 && (
                      <p className="text-sm text-destructive">{formatFieldErrors(field.state.meta.errors)}</p>
                    )}
                  </div>
                )}
              />
              <form.Field
                name="roleIds"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label>Roles</Label>
                    <div className="grid gap-2">
                      {roles.map((role: Role) => {
                        const checked = field.state.value.includes(role.id);
                        return (
                          <label key={role.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.handleChange([...field.state.value, role.id]);
                                } else {
                                  field.handleChange(field.state.value.filter((rid) => rid !== role.id));
                                }
                              }}
                            />
                            {role.name}
                          </label>
                        );
                      })}
                    </div>
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
                  <Button asChild type="button" variant="outline" disabled={isSubmitting}>
                    <Link to="/users">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={!canSubmit || isSubmitting}>
                    {isSubmitting ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              )}
            />
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
