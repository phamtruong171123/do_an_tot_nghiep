import { prisma } from "../../prisma";

export async function getGptConfig() {
  let config = await prisma.gptConfig.findFirst();
  if (!config) {
    config = await prisma.gptConfig.create({
      data: {
        apiKey: "",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4.1-mini",
        temperature: 0.3,
        systemPrompt: "",
      },
    });
  }
  return config;
}

export async function updateGptConfig(payload: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
}) {
  const existing = await getGptConfig();
  const config = await prisma.gptConfig.update({
    where: { id: existing.id },
    data: payload,
  });
  return config;
}
