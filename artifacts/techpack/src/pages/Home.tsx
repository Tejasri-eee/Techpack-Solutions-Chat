import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Products } from "@/components/sections/Products";
import { Contact } from "@/components/sections/Contact";
import { Chatbot } from "@/components/widgets/Chatbot";
import { WhatsAppButton } from "@/components/widgets/WhatsAppButton";
import { QuoteModal } from "@/components/widgets/QuoteModal";

export default function Home() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const handleOpenQuote = (productName?: string) => {
    setSelectedProduct(productName || null);
    setIsQuoteModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar onQuoteClick={() => handleOpenQuote()} />
      <main className="flex-1">
        <Hero />
        <About />
        <Services />
        <Products onQuoteClick={handleOpenQuote} />
        <Contact />
      </main>
      <Footer />
      <Chatbot />
      <WhatsAppButton />
      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        initialProduct={selectedProduct} 
      />
    </div>
  );
}
