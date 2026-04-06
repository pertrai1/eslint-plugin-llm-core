interface UserRecord {
  id: string;
  name: string;
  email: string;
}

const cache = new Map<string, any>();

export function getUser(filter) {
  return cache.get(filter);
}

export function transformUsers(users: UserRecord[]): UserRecord[] {
  const pending: Array<any> = [];
  for (const user of users) {
    pending.push(user);
  }
  return pending as UserRecord[];
}

export async function fetchUser(url: string): Promise<UserRecord> {
  try {
    const response = await fetch(url);
    return response.json() as any;
  } catch (error: any) {
    throw new Error("Fetch failed");
  }
}
