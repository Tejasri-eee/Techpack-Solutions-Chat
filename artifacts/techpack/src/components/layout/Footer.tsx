import { Box, Phone, Mail, MapPin } from "lucide-react";
import { company } from "@/lib/companyConfig";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Techpack.</span>
          </div>
          <p className="text-muted-foreground text-sm">{company.tagline}</p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <button
                onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                className="hover:text-primary transition-colors"
              >
                About Us
              </button>
            </li>
            <li>
              <button
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
                className="hover:text-primary transition-colors"
              >
                Services
              </button>
            </li>
            <li>
              <button
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                className="hover:text-primary transition-colors"
              >
                Products
              </button>
            </li>
            <li>
              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="hover:text-primary transition-colors"
              >
                Contact
              </button>
            </li>
          </ul>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-white font-semibold mb-4">Products</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Pouch Packing Materials</li>
            <li>Form Fill Seal Materials</li>
            <li>Shrink Wrap Materials</li>
            <li>Vacuum Packing Materials</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-white font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <a
                href={`tel:${company.phone}`}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Phone className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                {company.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${company.email}`}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Mail className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                {company.email}
              </a>
            </li>
            {(company.address || company.city) && (
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/60 mt-0.5" />
                <span>
                  {company.address && <>{company.address}<br /></>}
                  {company.city}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
        <p>&copy; {currentYear} {company.name}. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
