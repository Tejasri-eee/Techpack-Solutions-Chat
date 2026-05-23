import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Settings } from "lucide-react";

export function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-primary text-sm font-medium mb-6">
            <Settings className="w-4 h-4" />
            Precision Engineered For Scale
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
            Next-Generation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Packing Systems.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
            World-class industrial packing machinery designed for extreme reliability, throughput, and precision. We empower India's leading manufacturers to scale faster.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button 
              size="lg" 
              className="text-base font-semibold px-8 shadow-[0_0_20px_rgba(0,255,255,0.2)]"
              onClick={() => document.getElementById("products")?.scrollIntoView({behavior: "smooth"})}
            >
              Explore Products
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base font-semibold px-8 gap-2 group"
              onClick={() => document.getElementById("contact")?.scrollIntoView({behavior: "smooth"})}
            >
              Contact Sales
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="relative hidden lg:block"
        >
          <div className="aspect-square rounded-full border border-border border-dashed flex items-center justify-center relative animate-[spin_60s_linear_infinite]">
            <div className="absolute inset-4 rounded-full border border-border/50 border-dashed animate-[spin_40s_linear_infinite_reverse]" />
            <div className="absolute inset-12 rounded-full border border-primary/20 border-solid" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Minimal abstract machine representation */}
            <div className="w-64 h-64 bg-card border border-border rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-between p-6">
              <div className="w-full h-2 bg-primary/20 rounded-full mb-4">
                <div className="h-full bg-primary rounded-full w-2/3" />
              </div>
              <div className="flex-1 border border-border/50 rounded bg-background/50 flex items-center justify-center">
                <Settings className="w-12 h-12 text-muted-foreground animate-[spin_10s_linear_infinite]" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="h-2 bg-muted rounded-full" />
                <div className="h-2 bg-primary/50 rounded-full" />
                <div className="h-2 bg-muted rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
