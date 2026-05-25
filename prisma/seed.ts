import { prisma } from "../lib/prisma";
import { sampleEvents } from "../lib/samplePayloads";
import { processIncomingEvent } from "../lib/workflows/engine";

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.reviewQueueItem.deleteMany();
  await prisma.action.deleteMany();
  await prisma.event.deleteMany();

  await processIncomingEvent(sampleEvents.finance);
  await processIncomingEvent(sampleEvents.campaign);
  await processIncomingEvent(sampleEvents.guest);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
