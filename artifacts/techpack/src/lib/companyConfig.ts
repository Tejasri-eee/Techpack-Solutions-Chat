/**
 * Company configuration — edit this file to update all contact details
 * across the entire website at once. Leave address/city blank if not ready
 * to publish; those fields are automatically hidden when empty.
 */
export const company = {
  name: "Techpack Solutions",

  // Contact details
  phone: "+91 9505341122",
  whatsappNumber: "919505341122", // No spaces, no +, e.g. 919505341122
  email: "rajesh.k@techpacksolutions.co.in",

  // Physical address — leave blank to hide from website
  address: "",  // e.g. "Plot 45, Industrial Estate, Phase II"
  city: "",     // e.g. "Hyderabad, Telangana 500032"

  // Business hours shown in contact section
  hours: "Mon–Sat, 9:00 AM – 6:00 PM",

  // About section stats
  stats: {
    foundedYear: "2010",
    clients: "500+",
    experience: "15+",
    productLines: "50+",
  },

  // Footer tagline
  tagline:
    "Precision-engineered industrial packing solutions. Empowering manufacturers across India.",
} as const;
