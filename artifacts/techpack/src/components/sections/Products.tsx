import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export function Products() {
  const products = [
    {
      name: "Pouch Packing Machine",
      desc: "High-speed vertical form fill seal for granules, powders, and liquids.",
      tag: "Top Seller"
    },
    {
      name: "Form Fill Seal",
      desc: "Heavy-duty continuous motion packaging for industrial output.",
      tag: "High Volume"
    },
    {
      name: "Shrink Wrap Machine",
      desc: "Precision thermal wrapping for secure secondary packaging.",
      tag: ""
    },
    {
      name: "Vacuum Packing",
      desc: "Industrial-grade vacuum sealing for food and sensitive components.",
      tag: ""
    },
    {
      name: "Multi-head Weigher",
      desc: "Ultra-precise digital weighing systems integration.",
      tag: "High Precision"
    },
    {
      name: "Conveyor Systems",
      desc: "Custom modular belts for seamless production line flow.",
      tag: ""
    }
  ];

  return (
    <section id="products" className="py-24 bg-card/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
            >
              Our <span className="text-primary">Fleet.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg"
            >
              Industrial-grade machines designed for absolute precision and zero downtime.
            </motion.p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="bg-background border border-border p-6 rounded-xl h-full flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.05)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                </div>
                
                {product.tag && (
                  <div className="self-start px-2.5 py-1 rounded bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4 border border-primary/20">
                    {product.tag}
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-white mb-2 mt-auto pt-8">{product.name}</h3>
                <p className="text-muted-foreground">{product.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
