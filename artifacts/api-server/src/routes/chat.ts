import { Router, type IRouter } from "express";
import { SendMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

// System prompt for Techpack Solutions AI assistant
const SYSTEM_PROMPT = `You are an AI assistant for Techpack Solutions, a leading packing materials supplier based in India. You assist customers with professional, concise, and helpful responses.

Your expertise covers:
- Packing materials: Pouch Packing, Form Fill Seal, Shrink Wrap, Vacuum Packing, Multi-head Weighers, Conveyors, and more
- Spare parts and components for all packing materials
- Quotations and pricing inquiries
- Complaints and service issues — escalate serious complaints to customer care
- Inventory availability — if a product is unavailable, offer alternatives or connect to support
- AMC (Annual Maintenance Contracts) and service support
- Installation and commissioning

Important rules:
- Keep responses short, professional, and friendly (2-4 sentences max)
- Never repeat the same question more than once
- If a product is unavailable, say: "This item is currently out of stock. Please contact our customer care at +91-98765-43210 or email support@techpacksolutions.com for alternatives."
- After 3+ exchanges, if you haven't collected the customer's contact details, naturally ask: "To better assist you, may I know your name, phone number, and location?"
- Do not make up prices — say "Please contact us for an accurate quotation tailored to your needs."
- Always be helpful, never dismissive

Company info:
- Name: Techpack Solutions
- Phone: +91-98765-43210
- Email: info@techpacksolutions.com
- Support: support@techpacksolutions.com
- WhatsApp: +91-98765-43210
- Founded: 2010 | 500+ clients | 15+ years experience`;

// POST /chat — handle AI chat message
router.post("/chat", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid chat body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, conversationHistory } = parsed.data;

  // Attempt Groq API if key is available
  const groqApiKey = process.env.GROQ_API_KEY;
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;

  if (groqApiKey) {
    // Use Groq (llama3-8b-8192 is fast and free)
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (groqRes.ok) {
      const data = await groqRes.json() as { choices: Array<{ message: { content: string } }> };
      const reply = data.choices[0]?.message?.content ?? "I'm having trouble responding right now. Please try again.";
      res.json({ reply });
      return;
    }
    req.log.warn("Groq API call failed, falling back to rule-based response");
  } else if (openrouterApiKey) {
    // Use OpenRouter as fallback
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://techpacksolutions.com",
        "X-Title": "Techpack Solutions AI",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages,
        max_tokens: 300,
      }),
    });

    if (orRes.ok) {
      const data = await orRes.json() as { choices: Array<{ message: { content: string } }> };
      const reply = data.choices[0]?.message?.content ?? "I'm having trouble responding right now. Please try again.";
      res.json({ reply });
      return;
    }
    req.log.warn("OpenRouter API call failed, falling back to rule-based response");
  }

  // Rule-based fallback when no API key is configured
  const reply = getRuleBasedReply(message, conversationHistory.length);
  res.json({ reply });
});

// Intelligent rule-based responses for common packing machine queries
function getRuleBasedReply(message: string, historyLength: number): string {
  const lower = message.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! Welcome to Techpack Solutions. I'm here to help you with packing materials, spare parts, quotations, and service support. What can I assist you with today?";
  }

  if (lower.includes("pouch") || lower.includes("pouch packing")) {
    return "Our Pouch Packing Materials are designed for high-speed, precision packaging of powders, granules, and liquids. We offer vertical and horizontal variants with speeds up to 120 pouches/minute. Would you like a quotation or more technical specifications?";
  }

  if (lower.includes("form fill") || lower.includes("ffs")) {
    return "Our Form Fill Seal (FFS) machines are ideal for packaging snacks, spices, and dry goods. They offer automatic film unwinding, filling, and sealing in one integrated system. Shall I arrange a demo or send you a detailed brochure?";
  }

  if (lower.includes("shrink") || lower.includes("shrink wrap")) {
    return "Our Shrink Wrap Machines provide tamper-evident, professional packaging for bottles, boxes, and bundles. We have L-sealer and sleeve-wrapper variants. Please contact us for pricing tailored to your production volume.";
  }

  if (lower.includes("vacuum")) {
    return "Our Vacuum Packing Materials extend product shelf life by removing oxygen. Suitable for food, pharmaceutical, and industrial applications. Available in tabletop and floor-standing models. Would you like to discuss your requirements?";
  }

  if (lower.includes("spare") || lower.includes("parts")) {
    return "We stock genuine spare parts for all our machine models — sensors, belts, sealing jaws, cutting blades, and more. Please share your machine model and the part needed, and we'll check availability immediately.";
  }

  if (lower.includes("quot") || lower.includes("price") || lower.includes("cost")) {
    return "We'd be happy to provide a customized quotation. Pricing depends on machine type, capacity, and specifications. Please share your requirements and our team will send you a detailed quote within 24 hours.";
  }

  if (lower.includes("complaint") || lower.includes("issue") || lower.includes("problem")) {
    return "I'm sorry to hear you're experiencing an issue. For urgent support, please call our service line at +91-98765-43210 or email support@techpacksolutions.com. Our technicians are available 24/7 for critical breakdowns.";
  }

  if (lower.includes("service") || lower.includes("maintenance") || lower.includes("amc")) {
    return "Our Annual Maintenance Contract (AMC) covers preventive maintenance, emergency breakdowns, spare parts discounts, and priority support. We serve clients across India with a team of 50+ certified engineers. Shall I connect you with our service team?";
  }

  if (lower.includes("inventory") || lower.includes("stock") || lower.includes("available")) {
    return "Please share the specific machine model or part number you're looking for. I'll check our current inventory and get back to you. For urgent requirements, call us at +91-98765-43210.";
  }

  if (lower.includes("contact") || lower.includes("phone") || lower.includes("email") || lower.includes("address")) {
    return "You can reach Techpack Solutions at:\n📞 +91-98765-43210\n📧 info@techpacksolutions.com\n🕐 Mon–Sat, 9 AM – 6 PM\nWe're also available on WhatsApp for quick queries.";
  }

  if (lower.includes("location") || lower.includes("where")) {
    return "Techpack Solutions is headquartered in Mumbai, Maharashtra, with service centers across India including Delhi, Bangalore, Chennai, and Hyderabad. We serve clients pan-India with doorstep delivery and installation.";
  }

  // Prompt for contact info after a few exchanges
  if (historyLength >= 4) {
    return "I'd be glad to have our team follow up with you directly with detailed information. Could you please share your name, phone number, and city so we can assist you better?";
  }

  return "Thank you for your query. Techpack Solutions offers a comprehensive range of packing materials and after-sales services. Could you please describe your specific requirement in more detail so I can assist you accurately?";
}

export default router;
