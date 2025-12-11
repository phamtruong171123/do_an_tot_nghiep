// src/modules/gptConfig/gptConfig.routes.ts
import { Router } from "express";
import { getGptConfig, updateGptConfig } from "./gptConfig.service";
import { authRequired, adminOnly } from "../../middleware/auth";

const router = Router();

// Lấy config hiện tại
router.get("/", authRequired, adminOnly, async (req, res) => {
  const config = await getGptConfig();
  res.json({
    ...config,
    apiKey: config.apiKey,
  });
});

// Cập nhật config
router.patch("/", authRequired, adminOnly, async (req, res) => {
  const { apiKey, baseUrl, model, temperature, systemPrompt } = req.body;

  const data: any = { baseUrl, model, temperature, systemPrompt };

  // Chỉ update apiKey nếu gửi kèm, tránh ghi đè thành rỗng ngoài ý muốn
  if (typeof apiKey === "string" && apiKey.trim() !== "") {
    data.apiKey = apiKey.trim();
  }

  const updated = await updateGptConfig(data);

  res.json({
    ok: true,
    config: {
      ...updated,
      apiKey: updated.apiKey ? "********" : "",
    },
  });
});

// Test kết nối GPT
router.post("/test", authRequired, adminOnly, async (req, res) => {
  const { apiKey, baseUrl, model, temperature, systemPrompt, prompt } = req.body;

  // Lấy config hiện tại rồi merge với cái user đang nhập trên form (nếu có)
  const saved = await getGptConfig();

  const keyToUse = apiKey && apiKey.trim() ? apiKey.trim() : saved.apiKey;
  const baseUrlToUse = baseUrl || saved.baseUrl;
  const modelToUse = model || saved.model;
  const tempToUse = typeof temperature === "number" ? temperature : saved.temperature;
  const sysPromptToUse = systemPrompt || saved.systemPrompt || "Test connection";

  if (!keyToUse) {
    return res.status(400).json({ ok: false, error: "Missing apiKey" });
  }

  try {
    const OpenAI = require("openai");
    const client = new OpenAI({
      apiKey: keyToUse,
      baseURL: baseUrlToUse,
    });

    const completion = await client.chat.completions.create({
      model: modelToUse,
      temperature: tempToUse,
      messages: [
        { role: "system", content: sysPromptToUse },
        { role: "user", content: prompt || "Ping from CRM." },
      ],
    });

    const reply = completion.choices?.[0]?.message?.content || "";
    res.json({ ok: true, reply });
  } catch (e: any) {
    res.status(200).json({
      ok: false,
      error: e?.message || String(e),
    });
  }
});

export default router;
