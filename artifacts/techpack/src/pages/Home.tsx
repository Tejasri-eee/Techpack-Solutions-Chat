import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Products } from "@/components/sections/Products";
import { Contact } from "@/components/sections/Contact";
import { Chatbot } from "@/components/widgets/Chatbot";
import { WhatsAppButton } from "@/components/widgets/WhatsAppButton";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Services />
        <Products />
        <Contact />
      </main>
      <Footer />
      <Chatbot />
      <WhatsAppButton />
    </div>
  );
}
