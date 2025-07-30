import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();

const TEST_EMAIL = 'almir.hrvanovic@icloud.com';
const TEST_PASSWORD = 'QG\'"^Ukj:_9~%9F';

async function createTestUser() {
  console.log('🔧 Creating test user in database...\n');

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });

    if (existingUser) {
      console.log('⚠️  User already exists in database');
      console.log(`ID: ${existingUser.id}`);
      console.log(`Name: ${existingUser.name}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`Active: ${existingUser.isActive}`);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
      
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          password: hashedPassword,
          isActive: true,
        },
      });
      
      console.log('\n✅ Password updated successfully!');
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
      
      const newUser = await prisma.user.create({
        data: {
          email: TEST_EMAIL,
          name: 'Almir Hrvanovic',
          password: hashedPassword,
          role: UserRole.SUPERUSER,
          isActive: true,
          preferredLanguage: 'hr-HR',
        },
      });
      
      console.log('✅ User created successfully!');
      console.log(`ID: ${newUser.id}`);
      console.log(`Email: ${newUser.email}`);
      console.log(`Name: ${newUser.name}`);
      console.log(`Role: ${newUser.role}`);
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    
    if (user && user.password) {
      const isValid = await bcrypt.compare(TEST_PASSWORD, user.password);
      console.log(`\n🔐 Password verification: ${isValid ? 'PASSED' : 'FAILED'}`);
    }
    
    console.log('\n✨ User setup complete!');
    console.log('\nYou can now sign in with:');
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
createTestUser().catch(console.error);