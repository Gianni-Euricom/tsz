import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getUsers, type User } from '#/api/users';
import { Button } from '#/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table';

const fetchUsers = createServerFn({ method: 'GET' }).handler(async () => {
  return await getUsers();
});

export const Route = createFileRoute('/users/')({
  loader: () => fetchUsers(),
  component: Users,
});

function Users() {
  const users = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button asChild size="sm">
          <Link to="/users/new">New user</Link>
        </Button>
      </div>

      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: User) => (
            <TableRow
              key={user.id}
              onClick={() => navigate({ to: '/users/$id', params: { id: user.id } })}
              className={`cursor-pointer ${user.isActive ? '' : 'text-muted-foreground'}`}
            >
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.userRoles.map((ur) => ur.role.name).join(', ')}</TableCell>
              <TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
