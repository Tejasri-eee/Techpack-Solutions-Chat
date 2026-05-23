import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateOrderBody } from "@workspace/api-zod";
import { useCreateOrder } from "@workspace/api-client-react";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: string | null;
}

type FormValues = z.infer<typeof CreateOrderBody>;

export function QuoteModal({ isOpen, onClose, initialProduct }: QuoteModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutateAsync: createOrder, isPending } = useCreateOrder();

  const form = useForm<FormValues>({
    resolver: zodResolver(CreateOrderBody),
    defaultValues: {
      customerName: "",
      phone: "",
      location: "",
      productName: initialProduct || "",
      quantity: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        customerName: "",
        phone: "",
        location: "",
        productName: initialProduct || "",
        quantity: "",
        notes: "",
      });
      setIsSuccess(false);
    }
  }, [isOpen, initialProduct, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      await createOrder({ data });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to request quote", error);
      form.setError("root", { message: "Failed to submit quote request. Please try again." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#0d1626] text-white border-slate-800">
        <DialogHeader>
          <DialogTitle>Request a Quote</DialogTitle>
          <DialogDescription className="text-slate-400">
            Fill out the form below and we'll get back to you within 24 hours.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Thank You!</h3>
            <p className="text-slate-400">We'll contact you within 24 hours.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" className="bg-[#0a1220] border-slate-700" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 890" className="bg-[#0a1220] border-slate-700" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="City, Country" className="bg-[#0a1220] border-slate-700" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Select a product" 
                        readOnly={!!initialProduct} 
                        className="bg-[#0a1220] border-slate-700" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 500 units/day" className="bg-[#0a1220] border-slate-700" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any specific requirements..." 
                        className="bg-[#0a1220] border-slate-700 resize-none" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <p className="text-red-500 text-sm font-medium">{form.formState.errors.root.message}</p>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Submit Request
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
