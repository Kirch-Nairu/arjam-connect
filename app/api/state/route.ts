import {
  createServerConversation,
  readServerState,
  resetServerState,
  serverAgentMessage,
  serverCustomerMessage,
  serverMarkRead,
  serverSetStatus,
  serverSetTakeover,
  serverUpdateFaq,
} from "@/lib/server-state";
import { ConversationStatus, FaqItem, Platform } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await readServerState(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  let state;

  switch (body.action) {
    case "reset":
      state = await resetServerState();
      break;
    case "createConversation":
      state = await createServerConversation(body.platform as Platform, String(body.name ?? "Demo Guest"), String(body.conversationId));
      break;
    case "customerMessage":
      state = await serverCustomerMessage(String(body.conversationId), String(body.text ?? ""));
      break;
    case "agentMessage":
      state = await serverAgentMessage(String(body.conversationId), String(body.text ?? ""));
      break;
    case "takeover":
      state = await serverSetTakeover(String(body.conversationId), Boolean(body.active));
      break;
    case "markRead":
      state = await serverMarkRead(String(body.conversationId));
      break;
    case "setStatus":
      state = await serverSetStatus(String(body.conversationId), body.status as ConversationStatus);
      break;
    case "updateFaq":
      state = await serverUpdateFaq(String(body.faqId), (body.patch ?? {}) as Partial<FaqItem>);
      break;
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  return Response.json(state, { headers: { "Cache-Control": "no-store" } });
}
