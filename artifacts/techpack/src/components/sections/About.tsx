import { motion } from "framer-motion";
import { CheckCircle2, TrendingUp, Users, Package } from "lucide-react";

export function About() {
  const stats = [
    { label: "Founded", value: "2010", icon: TrendingUp },
    { label: "Active Clients", value: "500+", icon: Users },
    { label: "Years Experience", value: "15+", icon: CheckCircle2 },
    { label: "Product Lines", value: "50+", icon: Package },
  ];

  return (
    <section id="about" className="py-24 bg-card/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Engineering the Backbone of <span className="text-primary">Manufacturing.</span>
            </h2>
            <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
              <p>
                Since 2010, Techpack Solutions has been at the forefront of industrial automation. We don't just build machines; we engineer entire production ecosystems designed for relentless reliability.
              </p>
              <p>
                Based in India, we serve ambitious manufacturers looking to scale their throughput without compromising on precision. Our systems are built with heavy-duty materials, state-of-the-art sensors, and an obsessive attention to detail.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-background border border-border p-6 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon className="w-16 h-16 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <div className="text-3xl font-bold text-white mb-2 font-mono tracking-tight">{stat.value}</div>
                    <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
