import prisma from '../db.js';

export function saveInspection({ answers, ...inspection }) {
  return prisma.inspection.upsert({
    where: { id: inspection.id },
    // An existing id means the form was re-sent, so keep what was saved first.
    update: {},
    create: { ...inspection, answers: { create: answers } },
    omit: { image: true },
    include: { answers: true },
  });
}

export function findInspectionsByWorkOrder(workOrder) {
  return prisma.inspection.findMany({
    where: { workOrder },
    omit: { image: true },
    include: { answers: true },
    orderBy: { inspectedAt: 'desc' },
  });
}

export function findInspectionImage(id) {
  return prisma.inspection.findUnique({
    where: { id },
    select: { image: true, imageType: true },
  });
}
