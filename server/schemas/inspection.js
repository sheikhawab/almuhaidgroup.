import { z } from 'zod';

// Same ids as client/src/data/inspection-items.ts. The database stores itemId as plain text.
const ITEM_IDS = [
  'greenhouses',
  'engineering-design',
  'cybersecurity',
  'residential-units',
  'lab-equipment',
];

// Same limit as client/src/components/inspection-form.tsx.
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const REMARK_REQUIRED = 'Remark is required when the answer is no';

const itemId = z.enum(ITEM_IDS);

const answerSchema = z.discriminatedUnion('answer', [
  z.object({
    itemId,
    answer: z.literal('no'),
    remark: z.string(REMARK_REQUIRED).trim().min(1, REMARK_REQUIRED),
  }),
  z.object({
    itemId,
    answer: z.enum(['yes', 'na']),
  }),
]);

const hasUniqueItems = (answers) =>
  new Set(answers.map((answer) => answer.itemId)).size === answers.length;

export const inspectionSchema = z
  .object({
    id: z.uuid(),
    workOrder: z.string().trim().min(1),
    inspectedAt: z.iso.datetime(),
    image: z
      .base64()
      .transform((image) => Buffer.from(image, 'base64'))
      .refine((image) => image.length <= MAX_IMAGE_SIZE, {
        error: 'Image must not be larger than 5MB',
      })
      .optional(),
    imageType: z.string().startsWith('image/').optional(),
    answers: z
      .array(answerSchema)
      .length(ITEM_IDS.length)
      .refine(hasUniqueItems, { error: 'Each item can be answered only once' }),
  })
  .refine(({ image, imageType }) => Boolean(image) === Boolean(imageType), {
    path: ['imageType'],
    error: 'image and imageType must be sent together',
  });
