import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type ListFaqParams = {
  keyword?: string;
  isActive?: boolean;
};

export async function listFaqs(params: ListFaqParams) {
  const { keyword, isActive } = params;

  return prisma.faq.findMany({
    where: {
      AND: [
        keyword
          ? {
              OR: [
                { question: { contains: keyword } },
                { answer: { contains: keyword } },
              ],
            }
          : {},
        typeof isActive === "boolean" ? { isActive } : {},
      ],
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getFaq(id: number) {
  return prisma.faq.findUnique({ where: { id } });
}

type FaqInput = {
  question: string;
  answer: string;
  tags?: string[]; // sẽ được lưu Json
  language?: string;
  isActive?: boolean;
};

export async function createFaq(data: FaqInput) {
  return prisma.faq.create({
    data: {
      question: data.question,
      answer: data.answer,
      tags: data.tags ?? [],
      language: data.language ?? "vi",
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateFaq(id: number, data: FaqInput) {
  return prisma.faq.update({
    where: { id },
    data: {
      question: data.question,
      answer: data.answer,
      tags: data.tags ?? [],
      language: data.language ?? "vi",
      isActive: data.isActive ?? true,
    },
  });
}

export async function deleteFaq(id: number) {
  return prisma.faq.delete({ where: { id } });
}

/**
 * Hàm này dùng cho AI Suggestion:
 * Tìm các FAQ có nội dung gần giống text khách hỏi.
 * Tạm thời dùng contains đơn giản, sau nâng cấp sau.
 */
export async function searchFaqForSuggestion(text: string, limit = 5) {
  if (!text.trim()) return [];

  return prisma.faq.findMany({
    where: {
      isActive: true,
      OR: [
        { question: { contains: text } },
        { answer: { contains: text } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
