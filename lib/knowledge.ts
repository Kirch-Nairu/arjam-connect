import { FaqItem } from "./types";

export const defaultFaqItems: FaqItem[] = [
  {
    id: "faq-packages",
    intent: "packages",
    title: "Available travel packages",
    category: "Packages",
    keywords: ["package", "packages", "tour package", "offer", "available tour", "travel package"],
    answer:
      "Arjam Travel & Tours can assist with tour and travel package inquiries. Tell me your destination, preferred travel date, and number of guests so I can narrow down the right option for you.",
    enabled: true,
  },
  {
    id: "faq-pricing",
    intent: "pricing",
    title: "Package pricing",
    category: "Packages",
    keywords: ["how much", "hm", "price", "pricing", "rate", "rates", "cost", "pila", "tagpila", "magkano"],
    answer:
      "Package rates can vary depending on destination, travel date, guest count, transportation, and selected inclusions. Send those details and Arjam can prepare the appropriate quotation.",
    enabled: true,
  },
  {
    id: "faq-bohol",
    intent: "bohol_tour",
    title: "Bohol tours",
    category: "Packages",
    keywords: ["bohol", "countryside", "chocolate hills", "loboc"],
    answer:
      "Yes. Arjam can assist with Bohol tour inquiries. Share your preferred travel date and number of guests so I can continue the inquiry.",
    enabled: true,
  },
  {
    id: "faq-panglao",
    intent: "panglao_tour",
    title: "Panglao tours",
    category: "Packages",
    keywords: ["panglao", "alona", "balicasag", "island hopping"],
    answer:
      "Yes. Arjam can assist with Panglao travel and tour arrangements. Please share your travel date and number of guests.",
    enabled: true,
  },
  {
    id: "faq-pickup",
    intent: "pickup",
    title: "Airport or seaport pickup",
    category: "Transport",
    keywords: ["airport", "seaport", "pier", "pickup", "pick up", "transfer", "sundo", "hatid"],
    answer:
      "Pickup and transfer requirements can be included in a travel inquiry. Tell me your arrival point, travel date, and number of guests so Arjam can review the arrangement.",
    enabled: true,
  },
  {
    id: "faq-accommodation",
    intent: "accommodation",
    title: "Accommodation",
    category: "Packages",
    keywords: ["hotel", "accommodation", "room", "stay", "overnight", "resort", "lodging"],
    answer:
      "Arjam can assist with travel inquiries that include accommodation. Share your destination, travel dates, guest count, and preferred room setup so the team can review suitable options.",
    enabled: true,
  },
  {
    id: "faq-reservation",
    intent: "reservation",
    title: "Reservation process",
    category: "Booking",
    keywords: ["reserve", "reservation", "book", "booking", "how to book", "how can i book", "pa reserve"],
    answer:
      "To start a reservation inquiry, provide your destination, preferred travel date, number of guests, and contact details. An Arjam representative can then review the request and guide you through confirmation.",
    enabled: true,
  },
  {
    id: "faq-payment",
    intent: "payment",
    title: "Payment methods",
    category: "Booking",
    keywords: ["payment", "pay", "gcash", "bank", "deposit", "downpayment", "down payment", "bayad"],
    answer:
      "Approved payment instructions are provided by Arjam during the booking process. For security, this assistant will not invent or display unverified account details.",
    enabled: true,
  },
  {
    id: "faq-group",
    intent: "group_booking",
    title: "Group bookings",
    category: "Booking",
    keywords: ["group", "company outing", "team building", "large group", "pax", "people", "persons", "delegation"],
    answer:
      "Yes. Group travel inquiries can be accommodated. Provide the destination, preferred date, and estimated number of guests so Arjam can review the appropriate arrangement.",
    enabled: true,
  },
  {
    id: "faq-human",
    intent: "human_agent",
    title: "Human assistance",
    category: "Support",
    keywords: ["agent", "human", "representative", "person", "staff", "talk to someone", "speak with", "actual person"],
    answer:
      "Certainly. I’ll mark this conversation for human assistance so an Arjam Travel & Tours representative can continue with you.",
    enabled: true,
    handoff: true,
  },
  {
    id: "faq-custom",
    intent: "custom_package",
    title: "Customized packages",
    category: "Packages",
    keywords: ["custom", "customize", "customized", "custom package", "customize a package", "personalized", "special itinerary", "tailor"],
    answer:
      "Customized travel inquiries can be reviewed by Arjam. Send your destination, travel dates, guest count, and the activities or services you want included.",
    enabled: true,
  },
  {
    id: "faq-destinations",
    intent: "destinations",
    title: "Destinations covered",
    category: "Packages",
    keywords: ["destination", "destinations", "where do you", "where can", "places", "asa mo", "saan"],
    answer:
      "Tell me the destination you have in mind and I can record the inquiry for Arjam. Requests that need a custom arrangement can be reviewed directly by the team.",
    enabled: true,
  },
  {
    id: "faq-children",
    intent: "children",
    title: "Children in bookings",
    category: "Booking",
    keywords: ["child", "children", "kid", "kids", "baby", "infant", "bata"],
    answer:
      "Children can be included in the inquiry. Tell me how many adults and children are traveling, plus the travel date, so Arjam can account for the correct guest composition.",
    enabled: true,
  },
  {
    id: "faq-reschedule",
    intent: "change_date",
    title: "Changing travel dates",
    category: "Policies",
    keywords: ["change date", "reschedule", "move date", "different date", "change travel", "rebook"],
    answer:
      "Travel date changes depend on the specific booking and arrangements already made. An Arjam representative should confirm applicable conditions before any change is finalized.",
    enabled: true,
  },
  {
    id: "faq-quotation",
    intent: "quotation_requirements",
    title: "Quotation requirements",
    category: "Booking",
    keywords: ["quotation", "quote", "requirements", "what do you need", "details needed", "estimate"],
    answer:
      "For a useful quotation, provide your destination, preferred travel date, number of adults and children, origin or pickup point, and whether you need transportation or accommodation.",
    enabled: true,
  },
  {
    id: "faq-cancellation",
    intent: "cancellation",
    title: "Cancellation policy",
    category: "Policies",
    keywords: ["cancel", "cancellation", "refund", "cancel booking"],
    answer:
      "Cancellation and refund conditions can depend on the specific booking and third-party arrangements. An Arjam representative should verify the applicable policy for your booking before any commitment is made.",
    enabled: true,
  },
  {
    id: "faq-inclusions",
    intent: "inclusions",
    title: "Package inclusions",
    category: "Packages",
    keywords: ["package inclusions", "what are the package inclusions", "include", "included", "inclusions", "what is included", "apil", "kasama"],
    answer:
      "Package inclusions can vary by itinerary. Share the package or destination you are interested in and Arjam can confirm the approved inclusions for that specific quotation.",
    enabled: true,
  },
  {
    id: "faq-requirements",
    intent: "travel_requirements",
    title: "Travel requirements",
    category: "Policies",
    keywords: ["travel requirements", "requirements", "id needed", "documents", "valid id", "visa"],
    answer:
      "Travel requirements vary by destination and type of trip. For anything regulatory or destination-specific, Arjam should verify the latest applicable requirements before you rely on them.",
    enabled: true,
  },
];
