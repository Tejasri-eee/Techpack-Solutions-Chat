import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSendMessage, useCaptureLead } from "@workspace/api-client-react";
import { AnimatePresence, motion } from "framer-motion";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const leadSchema = z.object({
  name: z.string().min(2, "Required"),
  phone: z.string().min(10, "Required"),
  location: z.string().min(2, "Required"),
});

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi 👋 Welcome to Techpack Solutions. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = useSendMessage();
  const captureLeadMutation = useCaptureLead();

  const leadForm = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", phone: "", location: "" },
  });

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessageMutation.isPending, showLeadForm]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input } as Message];
    setMessages(newMessages);
    setInput("");

    sendMessageMutation.mutate({
      data: {
        message: input,
        conversationHistory: messages
      }
    }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
        
        // Trigger lead form if discussion is deep enough and not captured yet
        if (newMessages.length >= 5 && !leadCaptured && !showLeadForm) {
          // Check if AI might be asking for contact info
          const replyLower = data.reply.toLowerCase();
          if (replyLower.includes("name") || replyLower.includes("phone") || replyLower.includes("contact")) {
            setShowLeadForm(true);
          }
        }
      }
    });
  };

  const handleLeadSubmit = (values: z.infer<typeof leadSchema>) => {
    captureLeadMutation.mutate({
      data: {
        name: values.name,
        phone: values.phone,
        location: values.location,
        notes: "Captured via AI Chatbot",
      }
    }, {
      onSuccess: () => {
        setShowLeadForm(false);
        setLeadCaptured(true);
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "Thank you! I've saved your details. Our sales engineering team will reach out to you shortly." 
        }]);
      }
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1, height: isMinimized ? "auto" : "500px" }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border shadow-2xl rounded-2xl w-[350px] sm:w-[380px] mb-4 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-secondary p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-semibold text-white">Techpack Support</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => setIsMinimized(!isMinimized)}>
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.role === "user" 
                            ? "bg-primary text-primary-foreground rounded-tr-sm" 
                            : "bg-secondary text-secondary-foreground border border-border rounded-tl-sm"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {sendMessageMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-secondary border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                        </div>
                      </div>
                    )}

                    {showLeadForm && (
                      <div className="bg-background border border-primary/30 rounded-xl p-4 mt-4 text-sm">
                        <p className="text-primary font-medium mb-3 text-xs uppercase tracking-wider">Contact Details</p>
                        <Form {...leadForm}>
                          <form onSubmit={leadForm.handleSubmit(handleLeadSubmit)} className="space-y-3">
                            <FormField
                              control={leadForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormControl>
                                    <Input placeholder="Name" className="h-8 text-xs bg-secondary border-none" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={leadForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormControl>
                                    <Input placeholder="Phone" className="h-8 text-xs bg-secondary border-none" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={leadForm.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormControl>
                                    <Input placeholder="Company / Location" className="h-8 text-xs bg-secondary border-none" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <Button type="submit" size="sm" className="w-full h-8 text-xs mt-2" disabled={captureLeadMutation.isPending}>
                              {captureLeadMutation.isPending ? "Saving..." : "Submit"}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-3 bg-secondary/50 border-t border-border">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <Input 
                      placeholder="Type your message..." 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="bg-background border-border"
                      disabled={sendMessageMutation.isPending || showLeadForm}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!input.trim() || sendMessageMutation.isPending || showLeadForm}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={`h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 ${!isOpen && "shadow-[0_0_20px_rgba(0,255,255,0.4)]"}`}
        data-testid="btn-chatbot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>
    </div>
  );
}
