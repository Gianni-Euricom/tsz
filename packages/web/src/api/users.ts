import { type components } from './schema';
import { client } from './client';

export type UserDTO = components['schemas']['User'];
export type RoleDTO = components['schemas']['Role'];
export type UserRoleDTO = components['schemas']['UserRole'];
export type LeaveDTO = components['schemas']['Leave'];
export type UserLeaveDTO = components['schemas']['UserLeave'];
export type CreateUserRequestDTO = components['schemas']['CreateUserRequest'];
export type UpdateUserRequestDTO = components['schemas']['UpdateUserRequest'];
export type AddUserLeaveRequestDTO = components['schemas']['AddUserLeaveRequest'];
export type UpdateUserLeaveRequestDTO = components['schemas']['UpdateUserLeaveRequest'];

export type User = UserDTO;
export type Role = RoleDTO;
export type Leave = LeaveDTO;
export type UserLeave = UserLeaveDTO;

export const getUsers = async (): Promise<User[]> => {
  const resp = await client.GET('/api/users');
  return resp.data!;
};

export const getUserById = async (id: string): Promise<User> => {
  const resp = await client.GET('/api/users/{id}', { params: { path: { id } } });
  return resp.data!;
};

export const createUser = async (user: CreateUserRequestDTO): Promise<User> => {
  const resp = await client.POST('/api/users', { body: user });
  return resp.data!;
};

export const updateUser = async (id: string, user: UpdateUserRequestDTO): Promise<void> => {
  const resp = await client.PUT('/api/users/{id}', { params: { path: { id } }, body: user });
  return resp.data!;
};

export const removeUser = async (id: string): Promise<void> => {
  const resp = await client.DELETE('/api/users/{id}', { params: { path: { id } } });
  return resp.data!;
};

export const addUserLeave = async (userId: string, body: AddUserLeaveRequestDTO): Promise<UserLeave> => {
  const resp = await client.POST('/api/users/{userId}/leaves', {
    params: { path: { userId } },
    body,
  });
  return resp.data!;
};

export const updateUserLeave = async (
  userId: string,
  userLeaveId: string,
  body: UpdateUserLeaveRequestDTO,
): Promise<void> => {
  const resp = await client.PUT('/api/users/{userId}/leaves/{userLeaveId}', {
    params: { path: { userId, userLeaveId } },
    body,
  });
  return resp.data!;
};

export const getRoles = async (): Promise<Role[]> => {
  const resp = await client.GET('/api/roles');
  return resp.data!;
};

export const getLeaves = async (): Promise<Leave[]> => {
  const resp = await client.GET('/api/leaves');
  return resp.data!;
};
