import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import { useGetProducts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

interface ProductsProps {
  onQuoteClick?: (productName: string) => void;
}

export function Products({ onQuoteClick }: ProductsProps) {
  const { data: products = [], isLoading } = useGetProducts();
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <section id="products" className="py-24 bg-card/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold mb-4 text-white"
            >
              Our <span className="text-primary">Products.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-lg"
            >
              Premium packing materials designed for reliability, speed, and precision.
            </motion.p>
          </div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative w-full md:w-72"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              data-testid="input-product-search"
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm transition-colors"
            />
          </motion.div>
        </div>

        {/* No results */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            {search
              ? `No products matching "${search}". Try a different keyword.`
              : "No products available yet. Check back soon."}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-background border border-border p-6 rounded-xl h-64 flex flex-col relative overflow-hidden animate-pulse"
                >
                  <div className="h-6 w-24 bg-border/50 rounded mb-auto" />
                  <div className="h-6 w-3/4 bg-border/50 rounded mt-auto mb-2" />
                  <div className="h-4 w-full bg-border/50 rounded" />
                  <div className="h-10 w-full bg-border/50 rounded mt-4" />
                </div>
              ))
            : filtered.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.07 }}
                  className="group flex flex-col h-full"
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

                    <h3 className="text-xl font-bold text-white mb-2 mt-auto pt-8">
                      {product.name}
                    </h3>
                    <p className="text-muted-foreground flex-grow mb-6">{product.description}</p>

                    <Button
                      variant="outline"
                      className="w-full border-primary/20 text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => onQuoteClick?.(product.name)}
                      data-testid={`btn-request-quote-${product.id}`}
                    >
                      Request Quote
                    </Button>
                  </div>
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
}
