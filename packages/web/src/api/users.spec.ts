import { describe, it, expect, beforeEach, vi } from 'vite-plus/test';
import { ApiRequestError } from './client';
import {
  addUserLeave,
  createUser,
  getLeaves,
  getRoles,
  getUserById,
  getUsers,
  removeUser,
  updateUser,
  updateUserLeave,
} from './users';
import { emptyResponse, jsonResponse } from '@tests/fetch-util';

const mockFetch = vi.hoisted(() => {
  const mockFetch = vi.fn();
  globalThis.fetch = mockFetch as typeof fetch;
  return mockFetch;
});

const lastRequest = (): Request => mockFetch.mock.calls.at(-1)![0] as Request;

const userId1 = '11111111-1111-1111-1111-111111111111';
const userId2 = '22222222-2222-2222-2222-222222222222';
const userId3 = '33333333-3333-3333-3333-333333333333';
const userId7 = '77777777-7777-7777-7777-777777777777';
const userId9 = '99999999-9999-9999-9999-999999999999';
const userId12 = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const userLeaveId50 = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const roleId1 = 'a1111111-1111-1111-1111-111111111111';
const roleId2 = 'a2222222-2222-2222-2222-222222222222';
const roleId3 = 'a3333333-3333-3333-3333-333333333333';
const leaveId1 = 'b1111111-1111-1111-1111-111111111111';
const leaveId2 = 'b2222222-2222-2222-2222-222222222222';

beforeEach(() => {
  mockFetch.mockReset();
});

describe('users api', () => {
  it('getUsers → GET /api/users returns data', async () => {
    const users = [{ id: userId1, name: 'Alice', email: 'a@x.com', isActive: true, userRoles: [], userLeaves: [] }];
    mockFetch.mockResolvedValue(jsonResponse(users));

    await expect(getUsers()).resolves.toEqual(users);
    const req = lastRequest();
    expect(req.method).toBe('GET');
    expect(req.url).toBe(`${process.env.SERVER_URL}/api/users`);
  });

  it('getUsers → 404 throws ApiError', async () => {
    mockFetch.mockResolvedValue(emptyResponse(404));
    await expect(getUsers()).rejects.toThrow(new ApiRequestError(404));
  });

  it('getUsers → 500 throws ApiError', async () => {
    mockFetch.mockResolvedValue(emptyResponse(500));
    await expect(getUsers()).rejects.toThrow(new ApiRequestError(500));
  });

  it('getUserById → GET /api/users/{id} with path param', async () => {
    const user = { id: userId7, name: 'Bob', email: 'b@x.com', isActive: true, userRoles: [], userLeaves: [] };
    mockFetch.mockResolvedValue(jsonResponse(user));

    await expect(getUserById(userId7)).resolves.toEqual(user);
    expect(lastRequest().url).toBe(`${process.env.SERVER_URL}/api/users/${userId7}`);
  });

  it('createUser → POST /api/users with body', async () => {
    const created = { id: userId12, name: 'C', email: 'c@x.com', isActive: true, userRoles: [], userLeaves: [] };
    mockFetch.mockResolvedValue(jsonResponse(created, 201));
    const body = { name: 'C', email: 'c@x.com', roleIds: [roleId1, roleId2] };

    await expect(createUser(body)).resolves.toEqual(created);
    const req = lastRequest();
    expect(req.method).toBe('POST');
    expect(req.url).toBe(`${process.env.SERVER_URL}/api/users`);
    await expect(req.json()).resolves.toEqual(body);
  });

  it('updateUser → PUT /api/users/{id} with path + body', async () => {
    mockFetch.mockResolvedValue(emptyResponse(204));
    const body = { name: 'D', email: 'd@x.com', isActive: false, roleIds: [roleId3] };

    await updateUser(userId3, body);
    const req = lastRequest();
    expect(req.method).toBe('PUT');
    expect(req.url).toBe(`${process.env.SERVER_URL}/api/users/${userId3}`);
    await expect(req.json()).resolves.toEqual(body);
  });

  it('removeUser → DELETE /api/users/{id}', async () => {
    mockFetch.mockResolvedValue(emptyResponse(204));

    await removeUser(userId9);
    const req = lastRequest();
    expect(req.method).toBe('DELETE');
    expect(req.url).toBe(`${process.env.SERVER_URL}/api/users/${userId9}`);
  });

  it('addUserLeave → POST /api/users/{userId}/leaves with body', async () => {
    const created = {
      id: userLeaveId50,
      userId: userId7,
      leaveId: leaveId2,
      year: 2026,
      totalDays: 5,
      takenDays: 0,
      balanceDays: 5,
      leave: { id: leaveId2, name: 'ADV', isUnlimited: false, defaultTotalDays: 5 },
    };
    mockFetch.mockResolvedValue(jsonResponse(created, 201));
    const body = { leaveId: leaveId2, totalDays: 5 };

    await expect(addUserLeave(userId7, body)).resolves.toEqual(created);
    const req = lastRequest();
    expect(req.method).toBe('POST');
    expect(req.url).toBe(`${process.env.SERVER_URL}/api/users/${userId7}/leaves`);
    await expect(req.json()).resolves.toEqual(body);
  });

  it('updateUserLeave → PUT /api/users/{userId}/leaves/{userLeaveId} with both path params', async () => {
    mockFetch.mockResolvedValue(emptyResponse(204));
    const body = { totalDays: 7 };

    await updateUserLeave(userId7, userLeaveId50, body);
    const req = lastRequest();
    expect(req.method).toBe('PUT');
    expect(req.url).toBe(`${process.env.SERVER_URL}/api/users/${userId7}/leaves/${userLeaveId50}`);
    await expect(req.json()).resolves.toEqual(body);
  });

  it('updateUserLeave → 400 throws ApiError', async () => {
    mockFetch.mockResolvedValue(emptyResponse(400));
    await expect(updateUserLeave(userId1, userId2, { totalDays: null })).rejects.toThrow(new ApiRequestError(400));
  });

  it('getRoles → GET /api/roles returns data', async () => {
    const roles = [
      { id: roleId1, name: 'Consultant' },
      { id: roleId2, name: 'Admin' },
    ];
    mockFetch.mockResolvedValue(jsonResponse(roles));

    await expect(getRoles()).resolves.toEqual(roles);
    expect(lastRequest().url).toBe(`${process.env.SERVER_URL}/api/roles`);
  });

  it('getLeaves → GET /api/leaves returns data', async () => {
    const leaves = [
      { id: leaveId1, name: 'Holiday', isUnlimited: false, defaultTotalDays: 20 },
      { id: leaveId2, name: 'Sick', isUnlimited: true, defaultTotalDays: null },
    ];
    mockFetch.mockResolvedValue(jsonResponse(leaves));

    await expect(getLeaves()).resolves.toEqual(leaves);
    expect(lastRequest().url).toBe(`${process.env.SERVER_URL}/api/leaves`);
  });
});
