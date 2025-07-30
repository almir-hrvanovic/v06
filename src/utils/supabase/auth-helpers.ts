import { createClient } from './server';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAuthUser() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function requireAuth() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect('/auth/signin');
  }
  
  return user;
}

export async function getUserFromDB(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    return user;
  } catch (error) {
    console.error('Error fetching user from DB:', error);
    return null;
  }
}

export async function createOrUpdateSupabaseUser(email: string) {
  const supabase = await createClient();
  
  // Check if user exists in our database
  const dbUser = await getUserFromDB(email);
  
  if (!dbUser) {
    throw new Error('User not found in database');
  }
  
  return dbUser;
}