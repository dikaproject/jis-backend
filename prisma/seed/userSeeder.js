const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedUsers() {
    try {
        // Create test user
        const testUser = await prisma.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: {
                email: 'test@example.com',
                name: 'Test User',
                password: await bcrypt.hash('password123', 10),
                role: 'USER',
                profile: {
                    create: {
                        bio: 'Test user for image AI testing',
                        phoneNumber: 123456789,
                        age: 25,
                        wakeupTime: '06:00',
                        sleepTime: '22:00',
                        hobby: 'Testing AI',
                        questionerData: {
                            create: {
                                activities: 'Testing mood analysis'
                            }
                        }
                    }
                }
            }
        });

        console.log('Test user created:', testUser);

    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedUsers();