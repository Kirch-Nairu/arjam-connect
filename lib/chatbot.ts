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

const countWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

const countToken = "(?:\\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)";

function normalize(text: string) {
  return text.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();
}

function wordBoundaryIncludes(text: string, keyword: string) {
  if (keyword.includes(" ")) return text.includes(keyword);
  return new RegExp(`(^|\\s)${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "i").test(text);
}

function countFromToken(token?: string) {
  if (!token) return undefined;
  if (/^\d+$/.test(token)) return Number(token);
  return countWords[token.toLowerCase()];
}

function extractCount(text: string, labels: string) {
  const match = text.match(new RegExp(`\\b(${countToken})\\s*(?:${labels})\\b`, "i"));
  return countFromToken(match?.[1]);
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

  const explicitGuests = extractCount(text, "pax|people|persons|guests?|travellers?|travelers?");
  const adults = extractCount(text, "adults?");
  const children = extractCount(text, "children|child|kids?|kid|bata");
  const seniors = extractCount(text, "seniors?|senior citizens?|elderly");

  if (explicitGuests !== undefined) patch.guests = explicitGuests;
  if (adults !== undefined) patch.adults = adults;
  if (children !== undefined) patch.children = children;
  if (seniors !== undefined) patch.seniors = seniors;

  if (adults !== undefined || children !== undefined || seniors !== undefined) {
    patch.guests = Number(adults ?? 0) + Number(children ?? 0) + Number(seniors ?? 0);
  }

  if (text.includes("from cebu") || text.includes("gikan cebu") || text.includes("coming from cebu")) patch.origin = "Cebu";
  else if (text.includes("from manila") || text.includes("gikan manila") || text.includes("coming from manila")) patch.origin = "Manila";
  else if (text.includes("from tagbilaran") || text.includes("gikan tagbilaran")) patch.origin = "Tagbilaran";

  if (/\b(hotel|accommodation|room|resort|overnight)\b/.test(text)) patch.accommodation = true;
  if (/\b(airport|seaport|pickup|pick up|transfer|van|transport|sundo)\b/.test(text)) patch.transport = true;

  if (/\blimited mobility\b/.test(text)) patch.accessibilityNeeds = "Limited mobility";
  else if (/\bwheelchair(?: access| accessible| user)?\b/.test(text)) patch.accessibilityNeeds = "Wheelchair accessibility";
  else if (/\b(difficulty walking|walking difficulty|mobility assistance|accessibility assistance)\b/.test(text)) patch.accessibilityNeeds = "Mobility assistance";

  const durationOptions = Array.from(input.matchAll(/\b(\d{1,2}d\d{1,2}n)\b/gi)).map((match) => match[1].toUpperCase());
  if (durationOptions.length) patch.requestedDurationOptions = [...new Set(durationOptions)];

  if (/\b(recommend|recommendation|suggest|which is better|which would be better|better for us|best option|best for us)\b/.test(text)) {
    patch.recommendationRequested = true;
  }
  if (/\b(estimated|estimate|quotation|quote|total package cost|package cost|total cost|pricing|price|how much)\b/.test(text)) {
    patch.quotationRequested = true;
  }

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
  if (field === "guests") return "How many guests will be traveling? You can also specify adults, children, and seniors.";
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

function isComplexAdvisoryRequest(inquiry: Inquiry) {
  const recommendation = Boolean(inquiry.recommendationRequested);
  const quotation = Boolean(inquiry.quotationRequested);
  const accessibility = Boolean(inquiry.accessibilityNeeds);
  const multipleDurations = (inquiry.requestedDurationOptions?.length ?? 0) >= 2;
  return (recommendation && (quotation || accessibility || multipleDurations)) || (quotation && accessibility);
}

function formatTravelDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function partySummary(inquiry: Inquiry) {
  const parts: string[] = [];
  if (inquiry.adults !== undefined) parts.push(`${inquiry.adults} adult${inquiry.adults === 1 ? "" : "s"}`);
  if (inquiry.children !== undefined) parts.push(`${inquiry.children} ${inquiry.children === 1 ? "child" : "children"}`);
  if (inquiry.seniors !== undefined) parts.push(`${inquiry.seniors} senior${inquiry.seniors === 1 ? "" : "s"}`);
  if (inquiry.guests && parts.length) return `${inquiry.guests} travelers (${parts.join(", ")})`;
  if (inquiry.guests) return `${inquiry.guests} travelers`;
  return undefined;
}

function complexAdvisoryReply(inquiry: Inquiry) {
  const captured: string[] = [];
  if (inquiry.origin) captured.push(`origin from ${inquiry.origin}`);
  if (inquiry.destination) captured.push(`${inquiry.destination} trip`);
  const date = formatTravelDate(inquiry.travelDate);
  if (date) captured.push(`travel on ${date}`);
  const party = partySummary(inquiry);
  if (party) captured.push(party);
  if (inquiry.transport) captured.push("airport/transport pickup requested");
  if (inquiry.accommodation) captured.push("accommodation requested");
  if (inquiry.accessibilityNeeds) captured.push(`${inquiry.accessibilityNeeds.toLowerCase()} noted`);
  if (inquiry.requestedDurationOptions?.length) captured.push(`comparing ${inquiry.requestedDurationOptions.join(" and ")}`);

  const summary = captured.length ? `I’ve captured: ${captured.join("; ")}.` : "I’ve captured the details you provided.";

  return `${summary}\n\nThis needs a human review because the best trip length depends on itinerary pacing and accessibility, while an estimated total cost depends on Arjam’s approved rates and inclusions. I don’t want to guess either one. I’ll mark this for an Arjam representative to recommend the better option and prepare an accurate quotation.`;
}

export function createBotResult(
  input: string,
  conversation: Pick<Conversation, "inquiry" | "intent" | "status">,
  faqItems: FaqItem[],
): BotResult {
  const inquiryPatch = extractInquiry(input);
  const mergedInquiry = { ...conversation.inquiry, ...inquiryPatch };

  if (isComplexAdvisoryRequest(mergedInquiry)) {
    return {
      text: complexAdvisoryReply(mergedInquiry),
      intent: "complex_itinerary_quote",
      handoff: true,
      inquiryPatch,
      status: "needs_human",
    };
  }

  let faq = matchFaq(input, faqItems);
  const normalizedInput = normalize(input);
  const guestCountOnly = new RegExp(`^${countToken}\\s*(?:pax|people|persons|guests?|travellers?|travelers?)$`, "i").test(normalizedInput);
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
          "Thanks. I’ve captured the destination, travel date, and guest count. Your inquiry is now marked as qualified for the Arjam team. You can still send accommodation, pickup, accessibility, or other preferences.",
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
