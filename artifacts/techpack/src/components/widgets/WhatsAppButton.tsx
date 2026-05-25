import { SiWhatsapp } from "react-icons/si";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettings } from "@/lib/SettingsContext";

export function WhatsAppButton() {
  const company = useSettings();
  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={`https://wa.me/${company.whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 transition-transform shadow-[0_4px_15px_rgba(37,211,102,0.3)] hover:shadow-[0_4px_25px_rgba(37,211,102,0.5)]"
            aria-label="Contact us on WhatsApp"
            data-testid="btn-whatsapp"
          >
            <SiWhatsapp className="h-7 w-7" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-card text-foreground border-border font-medium ml-2">
          <p>Chat with Sales</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
