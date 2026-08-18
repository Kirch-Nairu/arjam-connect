export interface FaqMatch {
  intent: string;
  title: string;
  answer: string;
  keywords: string[];
  handoff?: boolean;
}

export const faqItems: FaqMatch[] = [
  {
    intent: "packages",
    title: "Available travel packages",
    keywords: ["package", "packages", "tour package", "offer", "available tour"],
    answer: "Arjam Travel & Tours can assist with tour and travel package inquiries. Tell me the destination you are interested in, your preferred travel date, and the number of guests so I can narrow down the right option for you."
  },
  {
    intent: "pricing",
    title: "Package pricing",
    keywords: ["how much", "hm", "price", "pricing", "rate", "rates", "cost", "pila", "tagpila"],
    answer: "Package rates can vary depending on destination, travel date, number of guests, transportation, and selected inclusions. Please send your preferred destination, travel date, and guest count so Arjam can prepare the appropriate quotation."
  },
  {
    intent: "bohol_tour",
    title: "Bohol tours",
    keywords: ["bohol", "countryside", "chocolate hills", "loboc"],
    answer: "Yes, Arjam Travel & Tours can assist with Bohol tour inquiries. How many guests will be traveling, and what date are you planning to visit?"
  },
  {
    intent: "panglao_tour",
    title: "Panglao tours",
    keywords: ["panglao", "alona", "island hopping", "balicasag"],
    answer: "Yes, Arjam can assist with Panglao travel and tour arrangements. Please share your travel date and number of guests so we can continue your inquiry."
  },
  {
    intent: "pickup",
    title: "Airport or seaport pickup",
    keywords: ["airport", "seaport", "pier", "pickup", "pick up", "transfer", "sundo"],
    answer: "Pickup and transfer requirements can be included in a travel inquiry. Please tell me your arrival point, travel date, and number of guests so Arjam can check the appropriate arrangement."
  },
  {
    intent: "accommodation",
    title: "Accommodation",
    keywords: ["hotel", "accommodation", "room", "stay", "overnight", "resort"],
    answer: "Arjam can assist with inquiries that include accommodation. Share your destination, travel dates, number of guests, and preferred room setup so the team can review suitable options."
  },
  {
    intent: "reservation",
    title: "Reservation process",
    keywords: ["reserve", "reservation", "book", "booking", "how to book", "how can i book"],
    answer: "To start a reservation inquiry, please provide your destination, preferred travel date, number of guests, and contact details. An Arjam representative can then review the request and guide you through confirmation."
  },
  {
    intent: "payment",
    title: "Payment methods",
    keywords: ["payment", "pay", "gcash", "bank", "deposit", "downpayment", "down payment"],
    answer: "Available payment instructions are provided by Arjam during the booking process. For security, I will not invent or display unverified payment account details. An Arjam representative can provide the approved payment method for your booking."
  },
  {
    intent: "group_booking",
    title: "Group bookings",
    keywords: ["group", "company outing", "team", "large group", "pax", "people", "persons"],
    answer: "Yes, group travel inquiries can be accommodated. Please provide the destination, preferred date, and estimated number of guests so Arjam can prepare an appropriate group arrangement."
  },
  {
    intent: "human_agent",
    title: "Human assistance",
    keywords: ["agent", "human", "representative", "person", "staff", "talk to someone", "speak with"],
    answer: "Certainly. I’ll mark this conversation for human assistance so an Arjam Travel & Tours representative can continue with you.",
    handoff: true
  },
  {
    intent: "custom_package",
    title: "Customized packages",
    keywords: ["custom", "customize", "customized", "personalized", "special itinerary"],
    answer: "Customized travel inquiries can be reviewed by Arjam. Please send your destination, travel dates, number of guests, and the activities or services you want included."
  },
  {
    intent: "destinations",
    title: "Destinations covered",
    keywords: ["destination", "destinations", "where do you", "where can", "places"],
    answer: "Tell me the destination you have in mind and I can record the inquiry for Arjam. For destinations that require a custom arrangement, the team can review the request directly."
  },
  {
    intent: "children",
    title: "Children in bookings",
    keywords: ["child", "children", "kid", "kids", "baby", "infant"],
    answer: "Children can be included in the inquiry. Please tell me how many adults and children are traveling, plus the travel date, so Arjam can account for the correct guest composition."
  },
  {
    intent: "change_date",
    title: "Changing travel dates",
    keywords: ["change date", "reschedule", "move date", "different date", "change travel"],
    answer: "Travel date changes depend on the specific booking and arrangements already made. I’ll record the request, but an Arjam representative should confirm any rescheduling conditions before changes are finalized."
  },
  {
    intent: "quotation_requirements",
    title: "Quotation requirements",
    keywords: ["quotation", "quote", "requirements", "what do you need", "details needed"],
    answer: "For a useful quotation, please provide your destination, preferred travel date, number of adults and children, origin or pickup point, and whether you need transportation or accommodation."
  }
];

const greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "maayong", "kumusta"];

export function matchFaq(input: string): FaqMatch | null {
  const text = input.toLowerCase().trim();
  let best: { faq: FaqMatch; score: number } | null = null;
  for (const faq of faqItems) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (text.includes(keyword)) score += Math.max(2, keyword.split(" ").length * 2);
    }
    if (!best || score > best.score) best = { faq, score };
  }
  return best && best.score > 0 ? best.faq : null;
}

export function chatbotReply(input: string): { text: string; intent?: string; handoff?: boolean } {
  const text = input.toLowerCase().trim();
  const faq = matchFaq(input);
  if (faq) return { text: faq.answer, intent: faq.intent, handoff: faq.handoff };
  if (greetings.some((g) => text === g || text.startsWith(`${g} `))) {
    return {
      text: "Hello! Welcome to Arjam Travel & Tours. I can help with packages, pricing, Bohol or Panglao tours, pickup, accommodation, reservations, payments, group travel, and other common inquiries. What would you like to ask?",
      intent: "greeting"
    };
  }
  return {
    text: "I want to make sure I give you the correct information. You can ask about tour packages, pricing, Bohol or Panglao tours, transportation, accommodation, reservations, payments, group bookings, or request a human representative.",
    intent: "fallback"
  };
}

export function extractInquiry(input: string) {
  const text = input.toLowerCase();
  const patch: Record<string, string | number> = {};
  if (text.includes("bohol")) patch.destination = "Bohol";
  else if (text.includes("panglao")) patch.destination = "Panglao";

  const pax = text.match(/\b(\d{1,2})\s*(?:pax|people|persons|guests?)\b/);
  if (pax) patch.guests = Number(pax[1]);
  const adults = text.match(/\b(\d{1,2})\s*adults?\b/);
  if (adults) patch.adults = Number(adults[1]);
  const children = text.match(/\b(\d{1,2})\s*(?:children|child|kids?)\b/);
  if (children) patch.children = Number(children[1]);
  if (patch.adults || patch.children) patch.guests = Number(patch.adults || 0) + Number(patch.children || 0);

  if (text.includes("from cebu") || text.includes("gikan cebu")) patch.origin = "Cebu";
  if (text.includes("from manila") || text.includes("gikan manila")) patch.origin = "Manila";
  if (text.includes("from tagbilaran")) patch.origin = "Tagbilaran";
  return patch;
}
