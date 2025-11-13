import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();


/** Lấy Page Access Token từ Channel theo pageId */
export async function getPageAccessToken(pageId: string) {
  const channel = await prisma.channel.findUnique({ where: { pageId } });
  if (!channel) throw new Error("Channel not found for given pageId");
  if (!channel.pageAccessToken) throw new Error("Missing page access token");
  return channel.pageAccessToken;
}

/** Gửi tin nhắn văn bản qua Graph API – giống hệt request cURL */
export async function sendTextMessageViaGraph(
  pageId: string,
  psid: string,
  text: string
) {
  // Nếu bạn đã có getPageAccessToken(pageId) thì dùng; tạm dùng env cho chắc
  const token =
    (await getPageAccessToken(pageId)) || process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("Missing PAGE-ACCESS-TOKEN");

  const apiVersion = process.env.FB_GRAPH_VERSION || "v24.0";

  // Base: https://graph.facebook.com/v24.0/PAGE-ID/messages
  const baseUrl = `https://graph.facebook.com/${apiVersion}/${pageId}/messages`;
  const url = new URL(baseUrl);

  // recipient={id:PSID}
  url.searchParams.set("recipient", `{id:${psid}}`);

  // message={text:'Your text'}
  // (đơn giản: bọc bằng ', nếu có ' trong text thì thay bằng \'
  const safeText = text.replace(/'/g, "\\'");
  url.searchParams.set("message", `{text:'${safeText}'}`);

  // messaging_type=RESPONSE
  url.searchParams.set("messaging_type", "RESPONSE");

  // access_token=PAGE-ACCESS-TOKEN
  url.searchParams.set("access_token", token);

  const finalUrl = url.toString();
 

  const r = await fetch(finalUrl, { method: "POST" }); // POST như sample
  const data: any = await r.json().catch(() => ({}));

  if (!r.ok) {
    const msg =
      data?.error?.message || `Facebook send failed (HTTP ${r.status})`;
    console.error("[FB SEND ERR]", msg, data);
    throw new Error(msg);
  }

  
  return data; // { recipient_id, message_id, ... }
}
