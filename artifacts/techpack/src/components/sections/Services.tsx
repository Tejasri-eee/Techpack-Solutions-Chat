import { motion } from "framer-motion";
import { Settings2, Wrench, PenTool, ShieldCheck, Factory, Lightbulb } from "lucide-react";

export function Services() {
  const services = [
    {
      title: "Machine Supply",
      description: "Turnkey delivery of world-class packing machinery configured for your specific production line.",
      icon: Factory
    },
    {
      title: "Spare Parts",
      description: "Immediate availability of genuine OEM parts to ensure zero downtime for your operations.",
      icon: Settings2
    },
    {
      title: "Installation",
      description: "Expert on-site deployment, calibration, and initial run testing by our engineering team.",
      icon: Wrench
    },
    {
      title: "AMC Contracts",
      description: "Comprehensive Annual Maintenance Contracts to keep your machines running at peak efficiency.",
      icon: ShieldCheck
    },
    {
      title: "Service Support",
      description: "24/7 technical support and rapid-response field service technicians across the country.",
      icon: PenTool
    },
    {
      title: "Custom Solutions",
      description: "Bespoke engineering for unique product dimensions, materials, or integration requirements.",
      icon: Lightbulb
    }
  ];

  return (
    <section id="services" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4 text-white"
          >
            End-to-End <span className="text-primary">Support.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg"
          >
            We partner with you beyond the sale, ensuring your production lines never stop.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border p-8 rounded-xl hover:bg-secondary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 text-primary">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
