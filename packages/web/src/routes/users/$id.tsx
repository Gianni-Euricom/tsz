import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, Link, notFound, useRouter } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ArrowLeft, Pencil } from 'lucide-react';
import { z } from 'zod';
import {
  addUserLeave,
  getLeaves,
  getRoles,
  getUserById,
  updateUser,
  updateUserLeave,
  type Leave,
  type Role,
  type User,
  type UserLeave,
} from '#/api/users';
import { Alert, AlertDescription } from '#/components/ui/alert';
import { Button } from '#/components/ui/button';
import { Card, CardContent } from '#/components/ui/card';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table';

const fetchPage = createServerFn({ method: 'GET' })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const [user, roles, leaves] = await Promise.all([getUserById(id).catch(() => null), getRoles(), getLeaves()]);
    if (!user) throw notFound();
    return { user, roles, leaves };
  });

const updateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').max(200),
  isActive: z.boolean(),
  roleIds: z.array(z.string().uuid()).min(1, 'Select at least one role'),
});

const saveUserFn = createServerFn({ method: 'POST' })
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => {
    const { id, ...payload } = data;
    await updateUser(id, payload);
  });

const updateLeaveSchema = z.object({
  userId: z.string().uuid(),
  userLeaveId: z.string().uuid(),
  totalDays: z.number().int().min(0).max(365).nullable(),
});

const saveUserLeaveFn = createServerFn({ method: 'POST' })
  .inputValidator(updateLeaveSchema)
  .handler(async ({ data }) => {
    const { userId, userLeaveId, ...payload } = data;
    await updateUserLeave(userId, userLeaveId, payload);
  });

const addLeaveSchema = z.object({
  userId: z.string().uuid(),
  leaveId: z.string().uuid(),
  totalDays: z.number().int().min(0).max(365).nullable(),
});

const addUserLeaveFn = createServerFn({ method: 'POST' })
  .inputValidator(addLeaveSchema)
  .handler(async ({ data }) => {
    const { userId, ...payload } = data;
    await addUserLeave(userId, payload);
  });

export const Route = createFileRoute('/users/$id')({
  loader: ({ params }) => fetchPage({ data: params.id }),
  component: UserDetail,
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

function UserDetail() {
  const { user, roles, leaves } = Route.useLoaderData();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

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
          {isEditing ? (
            <UserEditForm
              user={user}
              roles={roles}
              onCancel={() => setIsEditing(false)}
              onSaved={async () => {
                await router.invalidate();
                setIsEditing(false);
              }}
            />
          ) : (
            <UserReadView user={user} onEdit={() => setIsEditing(true)} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold tracking-tight">Leaves</h2>
          <LeavesTable user={user} leaves={leaves} />
          <AddLeaveControl user={user} leaves={leaves} />
        </CardContent>
      </Card>
    </main>
  );
}

function UserReadView({ user, onEdit }: { user: User; onEdit: () => void }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil />
          Edit
        </Button>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Email</dt>
          <dd className="mt-1 text-foreground">{user.email}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Status</dt>
          <dd className="mt-1 text-foreground">{user.isActive ? 'Active' : 'Inactive'}</dd>
        </div>
        <div className="col-span-2">
          <dt className="font-medium text-muted-foreground">Roles</dt>
          <dd className="mt-1 text-foreground">{user.userRoles.map((ur) => ur.role.name).join(', ')}</dd>
        </div>
      </dl>
    </>
  );
}

function UserEditForm({
  user,
  roles,
  onCancel,
  onSaved,
}: {
  user: User;
  roles: Role[];
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: user.name ?? '',
      email: user.email ?? '',
      isActive: user.isActive,
      roleIds: user.userRoles.map((ur) => ur.roleId),
    },
    validators: {
      onChange: updateUserSchema.omit({ id: true }),
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      try {
        await saveUserFn({ data: { id: user.id, ...value } });
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
      <h1 className="text-3xl font-bold tracking-tight">Edit user</h1>

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
          name="isActive"
          children={(field) => (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              Active
            </label>
          )}
        />
        <form.Field
          name="roleIds"
          children={(field) => (
            <div className="grid gap-2">
              <Label>Roles</Label>
              <div className="grid gap-2">
                {roles.map((role) => {
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

function LeavesTable({ user, leaves: _leaves }: { user: User; leaves: Leave[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <Table className="mt-4">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Allowed</TableHead>
          <TableHead>Year</TableHead>
          <TableHead>Total days</TableHead>
          <TableHead>Taken days</TableHead>
          <TableHead>Balance days</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {user.userLeaves.map((ul) =>
          editingId === ul.id && !ul.leave.isUnlimited ? (
            <LeaveEditRow
              key={ul.id}
              userId={user.id}
              userLeave={ul}
              onCancel={() => setEditingId(null)}
              onSaved={async () => {
                await router.invalidate();
                setEditingId(null);
              }}
            />
          ) : (
            <LeaveReadRow key={ul.id} userLeave={ul} onEdit={() => setEditingId(ul.id)} />
          ),
        )}
      </TableBody>
    </Table>
  );
}

function LeaveReadRow({ userLeave, onEdit }: { userLeave: UserLeave; onEdit: () => void }) {
  const unlimited = userLeave.leave.isUnlimited;
  return (
    <TableRow>
      <TableCell>{userLeave.leave.name}</TableCell>
      <TableCell>{unlimited ? 'Unlimited' : 'Limited'}</TableCell>
      <TableCell>{userLeave.year}</TableCell>
      <TableCell>{unlimited ? '' : userLeave.totalDays}</TableCell>
      <TableCell>{userLeave.takenDays}</TableCell>
      <TableCell>{unlimited ? '' : userLeave.balanceDays}</TableCell>
      <TableCell>
        {!unlimited && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function LeaveEditRow({
  userId,
  userLeave,
  onCancel,
  onSaved,
}: {
  userId: string;
  userLeave: UserLeave;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [totalDays, setTotalDays] = useState<number>(userLeave.totalDays ?? 0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSave = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await saveUserLeaveFn({
        data: {
          userId,
          userLeaveId: userLeave.id,
          totalDays,
        },
      });
      await onSaved();
    } catch {
      setSubmitError('Failed to save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TableRow>
      <TableCell>{userLeave.leave.name}</TableCell>
      <TableCell>Limited</TableCell>
      <TableCell>{userLeave.year}</TableCell>
      <TableCell>
        <Input
          type="number"
          value={totalDays}
          onChange={(e) => setTotalDays(e.target.valueAsNumber)}
          min={0}
          max={365}
          className="w-24"
        />
      </TableCell>
      <TableCell>{userLeave.takenDays}</TableCell>
      <TableCell>{totalDays - userLeave.takenDays}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
        </div>
        {submitError && <p className="mt-1 text-sm text-destructive">{submitError}</p>}
      </TableCell>
    </TableRow>
  );
}

function AddLeaveControl({ user, leaves }: { user: User; leaves: Leave[] }) {
  const router = useRouter();
  const assignedLeaveIds = new Set(user.userLeaves.map((ul) => ul.leaveId));
  const available = leaves.filter((l) => !assignedLeaveIds.has(l.id));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId !== null ? (leaves.find((l) => l.id === selectedId) ?? null) : null;

  const [totalDays, setTotalDays] = useState<number>(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (available.length === 0) return null;

  const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (!value) {
      setSelectedId(null);
      return;
    }
    setSelectedId(value);
    const leave = leaves.find((l) => l.id === value);
    setTotalDays(leave?.defaultTotalDays ?? 0);
    setSubmitError(null);
  };

  const onAdd = async () => {
    if (!selected) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await addUserLeaveFn({
        data: {
          userId: user.id,
          leaveId: selected.id,
          totalDays: selected.isUnlimited ? null : totalDays,
        },
      });
      setSelectedId(null);
      setTotalDays(0);
      await router.invalidate();
    } catch {
      setSubmitError('Failed to add leave.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-sm font-medium">Add leave</h3>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label htmlFor="add-leave-type">Type</Label>
          <select
            id="add-leave-type"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={selectedId ?? ''}
            onChange={onSelectChange}
          >
            <option value="">Select a leave type</option>
            {available.map((leave) => (
              <option key={leave.id} value={leave.id}>
                {leave.name}
              </option>
            ))}
          </select>
        </div>

        {selected && !selected.isUnlimited && (
          <div className="grid gap-1">
            <Label htmlFor="add-leave-total">Total days</Label>
            <Input
              id="add-leave-total"
              type="number"
              value={totalDays}
              onChange={(e) => setTotalDays(e.target.valueAsNumber)}
              min={0}
              max={365}
              className="w-24"
            />
          </div>
        )}

        <Button type="button" onClick={onAdd} disabled={!selected || isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add'}
        </Button>
      </div>
      {submitError && <p className="mt-2 text-sm text-destructive">{submitError}</p>}
    </div>
  );
}
