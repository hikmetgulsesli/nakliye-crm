import { getServerSession } from 'next-auth';
import { authOptions } from './index';

export async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return {
    user: {
      id: session.user.id as string,
      email: session.user.email as string,
      full_name: session.user.name as string,
      role: session.user.role as 'admin' | 'user',
    },
    expires: session.expires,
  };
}
