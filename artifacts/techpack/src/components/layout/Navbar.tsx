import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onQuoteClick?: () => void;
}

export function Navbar({ onQuoteClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-border/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => scrollTo("home")}
          data-testid="link-home"
        >
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md flex items-center justify-center">
            <Box className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Techpack.</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          {["about", "services", "products", "contact"].map((item) => (
            <button
              key={item}
              onClick={() => scrollTo(item)}
              className="hover:text-primary transition-colors capitalize"
              data-testid={`nav-link-${item}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center">
          <Button 
            onClick={onQuoteClick ? onQuoteClick : () => scrollTo("contact")}
            className="hidden md:flex font-semibold shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,255,255,0.5)] transition-shadow"
            data-testid="btn-nav-quote"
          >
            Get a Quote
          </Button>
        </div>
      </div>
    </nav>
  );
}
