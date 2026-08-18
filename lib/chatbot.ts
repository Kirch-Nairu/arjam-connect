import { BotResult, Conversation, ConversationStatus, FaqItem, Inquiry } from "./types";

const greetings = [
  "hi",
  "hello",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "maayong buntag",
  "maayong hapon",
  "maayong gabii",
  "kumusta",
];

const monthMap: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();
}

function wordBoundaryIncludes(text: string, keyword: string) {
  if (keyword.includes(" ")) return text.includes(keyword);
  return new RegExp(`(^|\\s)${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "i").test(text);
}

export function matchFaq(input: string, faqItems: FaqItem[]) {
  const text = normalize(input);
  let best: { faq: FaqItem; score: number } | null = null;

  for (const faq of faqItems) {
    if (!faq.enabled) continue;
    let score = 0;
    for (const keyword of faq.keywords) {
      const normalizedKeyword = normalize(keyword);
      if (wordBoundaryIncludes(text, normalizedKeyword)) {
        score += normalizedKeyword.includes(" ") ? 5 : Math.max(2, normalizedKeyword.length / 5);
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { faq, score };
  }
  return best?.faq ?? null;
}

function parseDate(text: string): string | undefined {
  const currentYear = new Date().getFullYear();
  const monthName = text.match(
    /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:,?\s+(\d{4}))?\b/i,
  );
  if (monthName) {
    const month = monthMap[monthName[1].toLowerCase()];
    const day = Number(monthName[2]);
    const year = monthName[3] ? Number(monthName[3]) : currentYear;
    if (day >= 1 && day <= 31) return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const numeric = text.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
  if (numeric) {
    const month = Number(numeric[1]);
    const day = Number(numeric[2]);
    let year = numeric[3] ? Number(numeric[3]) : currentYear;
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return undefined;
}

export function extractInquiry(input: string): Partial<Inquiry> {
  const text = normalize(input);
  const patch: Partial<Inquiry> = {};

  if (text.includes("bohol")) patch.destination = "Bohol";
  else if (text.includes("panglao")) patch.destination = "Panglao";
  else if (text.includes("cebu tour")) patch.destination = "Cebu";

  const guests = text.match(/\b(\d{1,3})\s*(?:pax|people|persons|guests?|travellers?|travelers?)\b/);
  const adults = text.match(/\b(\d{1,3})\s*adults?\b/);
  const children = text.match(/\b(\d{1,3})\s*(?:children|child|kids?|bata)\b/);
  if (guests) patch.guests = Number(guests[1]);
  if (adults) patch.adults = Number(adults[1]);
  if (children) patch.children = Number(children[1]);
  if (patch.adults !== undefined || patch.children !== undefined) {
    patch.guests = Number(patch.adults ?? 0) + Number(patch.children ?? 0);
  }

  if (text.includes("from cebu") || text.includes("gikan cebu") || text.includes("coming from cebu")) patch.origin = "Cebu";
  else if (text.includes("from manila") || text.includes("gikan manila") || text.includes("coming from manila")) patch.origin = "Manila";
  else if (text.includes("from tagbilaran") || text.includes("gikan tagbilaran")) patch.origin = "Tagbilaran";

  if (/\b(hotel|accommodation|room|resort|overnight)\b/.test(text)) patch.accommodation = true;
  if (/\b(airport|seaport|pickup|pick up|transfer|van|transport|sundo)\b/.test(text)) patch.transport = true;

  const phone = input.match(/(?:\+63|0)9\d{9}/);
  if (phone) patch.contactNumber = phone[0];

  const date = parseDate(input);
  if (date) patch.travelDate = date;
  return patch;
}

function missingQualification(inquiry: Inquiry) {
  if (!inquiry.destination) return "destination";
  if (!inquiry.travelDate) return "travelDate";
  if (!inquiry.guests) return "guests";
  return null;
}

function qualificationQuestion(field: ReturnType<typeof missingQualification>) {
  if (field === "destination") return "Which destination are you interested in?";
  if (field === "travelDate") return "What date are you planning to travel?";
  if (field === "guests") return "How many guests will be traveling? You can also specify adults and children.";
  return "";
}

function isGreeting(input: string) {
  const text = normalize(input);
  return greetings.some((greeting) => text === greeting || text.startsWith(`${greeting} `));
}

function isQualificationIntent(intent?: string) {
  return Boolean(
    intent &&
      [
        "packages",
        "pricing",
        "bohol_tour",
        "panglao_tour",
        "pickup",
        "accommodation",
        "reservation",
        "group_booking",
        "custom_package",
        "quotation_requirements",
      ].includes(intent),
  );
}

function statusFrom(inquiry: Inquiry, currentIntent: string | undefined, needsHuman: boolean): ConversationStatus {
  if (needsHuman) return "needs_human";
  const enough = Boolean(inquiry.destination && inquiry.travelDate && inquiry.guests);
  if (enough) return "qualified";
  if (isQualificationIntent(currentIntent) || Object.keys(inquiry).length > 0) return "qualifying";
  return "new";
}

export function createBotResult(
  input: string,
  conversation: Pick<Conversation, "inquiry" | "intent" | "status">,
  faqItems: FaqItem[],
): BotResult {
  const inquiryPatch = extractInquiry(input);
  const mergedInquiry = { ...conversation.inquiry, ...inquiryPatch };
  let faq = matchFaq(input, faqItems);
  const normalizedInput = normalize(input);
  const guestCountOnly = /^\d{1,3}\s*(?:pax|people|persons|guests?|travellers?|travelers?)$/.test(normalizedInput);
  if (faq?.intent === "group_booking" && conversation.intent && guestCountOnly) faq = null;
  const intent = faq?.intent ?? conversation.intent;

  if (faq?.handoff) {
    return {
      text: faq.answer,
      intent: faq.intent,
      handoff: true,
      inquiryPatch,
      status: "needs_human",
    };
  }

  if (faq) {
    const missing = isQualificationIntent(faq.intent) ? missingQualification(mergedInquiry) : null;
    const enough = missing === null && isQualificationIntent(faq.intent);
    return {
      text: enough
        ? `${faq.answer}\n\nI’ve captured the key inquiry details. I’ll keep this marked as a qualified inquiry for the Arjam team.`
        : missing
          ? `${faq.answer}\n\n${qualificationQuestion(missing)}`
          : faq.answer,
      intent: faq.intent,
      inquiryPatch,
      status: statusFrom(mergedInquiry, faq.intent, false),
    };
  }

  if (isGreeting(input)) {
    return {
      text:
        "Hello! Welcome to Arjam Travel & Tours. I can help with packages, pricing, Bohol or Panglao tours, pickup, accommodation, reservations, payments, group travel, and other common inquiries. What would you like to ask?",
      intent: "greeting",
      inquiryPatch,
      status: statusFrom(mergedInquiry, intent, false),
    };
  }

  if (Object.keys(inquiryPatch).length > 0 || isQualificationIntent(intent)) {
    const missing = missingQualification(mergedInquiry);
    if (!missing) {
      return {
        text:
          "Thanks. I’ve captured the destination, travel date, and guest count. Your inquiry is now marked as qualified for the Arjam team. You can still send accommodation, pickup, or other preferences.",
        intent,
        inquiryPatch,
        status: "qualified",
      };
    }
    return {
      text: `Got it. I’ve added that to your inquiry. ${qualificationQuestion(missing)}`,
      intent,
      inquiryPatch,
      status: "qualifying",
    };
  }

  return {
    text:
      "I want to make sure I give you the correct information. You can ask about tour packages, pricing, Bohol or Panglao tours, transportation, accommodation, reservations, payments, group bookings, package inclusions, cancellations, or request a human representative.",
    intent: "fallback",
    inquiryPatch,
    status: conversation.status,
  };
}
