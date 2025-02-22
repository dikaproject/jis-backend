const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create default quest templates
  const questTemplates = [
    {
      type: 'BREATHING',
      title: '5-Minute Breathing Exercise',
      description: 'Practice deep breathing for relaxation',
      duration: 300,
      isActive: true
    },
    {
      type: 'MUSIC',
      title: 'Calming Music Session',
      description: 'Listen to soothing music',
      duration: 600,
      url: 'https://example.com/calming-music.mp3',
      isActive: true
    },
    {
      type: 'VIDEO',
      title: 'Guided Meditation',
      description: 'Follow along with this meditation video',
      duration: 900,
      url: 'https://example.com/meditation-video.mp4',
      isActive: true
    }
  ];

  for (const template of questTemplates) {
    await prisma.questTemplate.upsert({
      where: {
        title_type: {
          title: template.title,
          type: template.type
        }
      },
      update: template,
      create: template
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });