import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCaptureLead, useGetContacts } from "@workspace/api-client-react";
import { Mail, Phone, MapPin, Send, User, Briefcase, Clock } from "lucide-react";
import { company } from "@/lib/companyConfig";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  message: z.string().min(10, "Please provide more details"),
});

export function Contact() {
  const { toast } = useToast();
  const captureLead = useCaptureLead();
  const { data: contacts = [] } = useGetContacts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    captureLead.mutate(
      {
        data: {
          name: values.name,
          phone: values.phone,
          location: values.email,
          notes: values.message,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Request Sent Successfully",
            description: "Our sales team will contact you shortly.",
          });
          form.reset();
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to send request. Please try again.",
          });
        },
      }
    );
  }

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left — contact info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Ready to <span className="text-primary">Upgrade?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-12 max-w-md">
              Speak with our team to configure the perfect packaging solution for your production line.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-card border border-border flex items-center justify-center text-primary shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Call Us Directly</h4>
                  <a
                    href={`tel:${company.phone}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {company.phone}
                  </a>
                  <p className="text-muted-foreground text-sm mt-0.5">{company.hours}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-card border border-border flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Email Us</h4>
                  <a
                    href={`mailto:${company.email}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {company.email}
                  </a>
                </div>
              </div>

              {(company.address || company.city) && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-card border border-border flex items-center justify-center text-primary shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Our Location</h4>
                    {company.address && <p className="text-muted-foreground">{company.address}</p>}
                    {company.city && <p className="text-muted-foreground">{company.city}</p>}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded bg-card border border-border flex items-center justify-center text-primary shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Business Hours</h4>
                  <p className="text-muted-foreground">{company.hours}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right — quote form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-xl p-8 shadow-xl relative"
          >
            <h3 className="text-2xl font-semibold text-white mb-6">Request a Quote</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company / Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your company or name" {...field} className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="you@company.com" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 XXXXX XXXXX" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements / Specifications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about the product you pack, speed required, quantity, etc."
                          className="min-h-[120px] bg-background resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-4 font-semibold text-base gap-2"
                  disabled={captureLead.isPending}
                >
                  {captureLead.isPending ? "Sending..." : "Submit Request"}
                  {!captureLead.isPending && <Send className="w-4 h-4" />}
                </Button>
              </form>
            </Form>
          </motion.div>
        </div>

        {/* ── Team Contacts (populated from admin panel) ─────────────────── */}
        {contacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white">
                Our <span className="text-primary">Team.</span>
              </h3>
              <p className="text-muted-foreground mt-2">
                Reach our specialists directly for faster assistance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map((contact, i) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{contact.name}</p>
                      <p className="text-primary text-xs flex items-center gap-1">
                        <Briefcase className="w-3 h-3 shrink-0" />
                        <span className="truncate">{contact.role}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-cyan-400 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                      <span className="truncate">{contact.phone}</span>
                    </a>

                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-cyan-400 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/60" />
                      <span className="truncate">{contact.location}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
