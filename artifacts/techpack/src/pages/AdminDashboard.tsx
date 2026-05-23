import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import {
  useGetLeads,
  useGetOrders,
  useUpdateOrderStatus,
  useGetProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getGetProductsQueryKey,
  getGetOrdersQueryKey,
} from "@workspace/api-client-react";
import {
  LogOut, Users, Phone, MapPin, Search, RefreshCw, Download,
  ChevronUp, ChevronDown, Package, ShoppingCart,
  Trash2, Plus, Pencil, ToggleLeft, ToggleRight, Contact,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ── Types ────────────────────────────────────────────────────────────────────

type SortKey = "name" | "location" | "createdAt";
type SortDir = "asc" | "desc";

interface ProductFormState {
  name: string;
  description: string;
  category: string;
  tag: string;
}

interface ContactFormState {
  name: string;
  role: string;
  phone: string;
  email: string;
  location: string;
}

interface AdminContact {
  id: number;
  name: string;
  role: string;
  phone: string;
  email: string | null;
  location: string;
  isActive: boolean;
  createdAt: string;
}

const emptyProductForm: ProductFormState = { name: "", description: "", category: "", tag: "" };
const emptyContactForm: ContactFormState = { name: "", role: "", phone: "", email: "", location: "" };

// ── Module-level components (never recreated on re-render) ───────────────────

function ProductFormFields({ form, setForm }: { form: ProductFormState; setForm: (f: ProductFormState) => void }) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Product Name *</Label>
        <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0a1220] border-slate-700" placeholder="e.g. Stretch Film Roll" />
      </div>
      <div className="space-y-2">
        <Label>Description *</Label>
        <Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-[#0a1220] border-slate-700 resize-none" rows={3} placeholder="Short product description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-[#0a1220] border-slate-700" placeholder="e.g. Films" />
        </div>
        <div className="space-y-2">
          <Label>Tag</Label>
          <Input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="bg-[#0a1220] border-slate-700" placeholder="e.g. Top Seller" />
        </div>
      </div>
    </div>
  );
}

function ContactFormFields({ form, setForm }: { form: ContactFormState; setForm: (f: ContactFormState) => void }) {
  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name *</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#0a1220] border-slate-700" placeholder="e.g. Rajesh Kumar" />
        </div>
        <div className="space-y-2">
          <Label>Role / Designation *</Label>
          <Input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="bg-[#0a1220] border-slate-700" placeholder="e.g. Sales Manager" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-[#0a1220] border-slate-700" placeholder="+91 98765 43210" />
        </div>
        <div className="space-y-2">
          <Label>Email ID</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-[#0a1220] border-slate-700" placeholder="name@company.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Service / Delivery Location *</Label>
        <Input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-[#0a1220] border-slate-700" placeholder="e.g. Mumbai, Maharashtra" />
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  quoted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  closed: "bg-green-500/20 text-green-400 border-green-500/30",
};

function getAdminToken() {
  return sessionStorage.getItem("tp_admin_token") ?? "";
}

async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAdminToken()}`,
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const ADMIN_CONTACTS_KEY = ["admin-contacts"];

// ── Dashboard ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [leadsSearch, setLeadsSearch] = useState("");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [productsSearch, setProductsSearch] = useState("");
  const [contactsSearch, setContactsSearch] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [addProductForm, setAddProductForm] = useState<ProductFormState>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductForm, setEditProductForm] = useState<ProductFormState>(emptyProductForm);

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [addContactForm, setAddContactForm] = useState<ContactFormState>(emptyContactForm);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [editContactForm, setEditContactForm] = useState<ContactFormState>(emptyContactForm);

  useEffect(() => {
    if (!sessionStorage.getItem("tp_admin_auth")) setLocation("/admin");
  }, [setLocation]);

  // ── Data hooks ─────────────────────────────────────────────────────────────

  const { data: leads = [], isLoading: isLoadingLeads, refetch: refetchLeads, isFetching: isFetchingLeads } = useGetLeads();
  const { data: orders = [], isLoading: isLoadingOrders, refetch: refetchOrders, isFetching: isFetchingOrders } = useGetOrders();
  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts, isFetching: isFetchingProducts } = useGetProducts();

  const {
    data: contacts = [],
    isLoading: isLoadingContacts,
    refetch: refetchContacts,
    isFetching: isFetchingContacts,
  } = useQuery<AdminContact[]>({
    queryKey: ADMIN_CONTACTS_KEY,
    queryFn: () => adminFetch<AdminContact[]>("/api/admin/contacts"),
    enabled: !!sessionStorage.getItem("tp_admin_auth"),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const { mutate: updateOrderStatus } = useUpdateOrderStatus();
  const { mutateAsync: createProduct, isPending: isCreatingProduct } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdatingProduct } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

  const invalidateContacts = () => queryClient.invalidateQueries({ queryKey: ADMIN_CONTACTS_KEY });

  const createContactMutation = useMutation({
    mutationFn: (data: ContactFormState) =>
      adminFetch<AdminContact>("/api/admin/contacts", { method: "POST", body: JSON.stringify({ ...data, email: data.email || null }) }),
    onSuccess: invalidateContacts,
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ContactFormState }) =>
      adminFetch<AdminContact>(`/api/admin/contacts/${id}`, { method: "PUT", body: JSON.stringify({ ...data, email: data.email || null }) }),
    onSuccess: invalidateContacts,
  });

  const toggleContactMutation = useMutation({
    mutationFn: ({ contact }: { contact: AdminContact }) =>
      adminFetch<AdminContact>(`/api/admin/contacts/${contact.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: contact.name, role: contact.role, phone: contact.phone,
          email: contact.email, location: contact.location, isActive: !contact.isActive,
        }),
      }),
    onSuccess: invalidateContacts,
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => adminFetch<void>(`/api/admin/contacts/${id}`, { method: "DELETE" }),
    onSuccess: invalidateContacts,
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleLogout = () => {
    sessionStorage.removeItem("tp_admin_auth");
    sessionStorage.removeItem("tp_admin_token");
    setLocation("/admin");
  };

  const handleRefresh = () => { refetchLeads(); refetchOrders(); refetchProducts(); refetchContacts(); };
  const isRefreshing = isFetchingLeads || isFetchingOrders || isFetchingProducts || isFetchingContacts;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filteredLeads = leads
    .filter((l) => {
      const q = leadsSearch.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.location.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const av = sortKey === "createdAt" ? new Date(a.createdAt).getTime().toString() : (a[sortKey] ?? "");
      const bv = sortKey === "createdAt" ? new Date(b.createdAt).getTime().toString() : (b[sortKey] ?? "");
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  const filteredOrders = orders.filter((o) => {
    const q = ordersSearch.toLowerCase();
    return o.customerName.toLowerCase().includes(q) || o.phone.includes(q) || o.productName.toLowerCase().includes(q);
  });

  const filteredProducts = products.filter((p) => {
    const q = productsSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const filteredContacts = contacts.filter((c) => {
    const q = contactsSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.location.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  const exportCSV = (header: string, rows: string[], filename: string) => {
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLeads = () => exportCSV(
    "Name,Phone,Location,Notes,Date",
    filteredLeads.map((l) => `"${l.name}","${l.phone}","${l.location}","${l.notes ?? ""}","${formatDate(l.createdAt)}"`),
    `techpack-leads-${Date.now()}.csv`
  );

  const handleExportOrders = () => exportCSV(
    "Customer,Phone,Location,Product,Quantity,Status,Notes,Date",
    filteredOrders.map((o) => `"${o.customerName}","${o.phone}","${o.location}","${o.productName}","${o.quantity ?? ""}","${o.status}","${o.notes ?? ""}","${formatDate(o.createdAt)}"`),
    `techpack-orders-${Date.now()}.csv`
  );

  const handleExportContacts = () => exportCSV(
    "Name,Role,Phone,Email,Location,Active",
    filteredContacts.map((c) => `"${c.name}","${c.role}","${c.phone}","${c.email ?? ""}","${c.location}","${c.isActive}"`),
    `techpack-contacts-${Date.now()}.csv`
  );

  const handleStatusChange = (orderId: number, status: "new" | "contacted" | "quoted" | "closed") => {
    updateOrderStatus({ id: orderId, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() }),
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct({ data: { name: addProductForm.name, description: addProductForm.description, category: addProductForm.category || null, tag: addProductForm.tag || null, isActive: true } });
    queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
    setIsAddProductOpen(false);
    setAddProductForm(emptyProductForm);
  };

  const openEditProduct = (p: { id: number; name: string; description: string; category?: string | null; tag?: string | null }) => {
    setEditingProductId(p.id);
    setEditProductForm({ name: p.name, description: p.description, category: p.category ?? "", tag: p.tag ?? "" });
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    await updateProduct({ id: editingProductId, data: { name: editProductForm.name, description: editProductForm.description, category: editProductForm.category || null, tag: editProductForm.tag || null } });
    queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
    setEditingProductId(null);
    setEditProductForm(emptyProductForm);
  };

  const handleToggleProduct = (p: { id: number; name: string; description: string; category?: string | null; tag?: string | null; isActive: boolean }) => {
    updateProduct({ id: p.id, data: { name: p.name, description: p.description, category: p.category ?? null, tag: p.tag ?? null, isActive: !p.isActive } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }),
    });
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Delete this product?")) {
      deleteProduct({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }) });
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    await createContactMutation.mutateAsync(addContactForm);
    setIsAddContactOpen(false);
    setAddContactForm(emptyContactForm);
  };

  const openEditContact = (c: AdminContact) => {
    setEditingContactId(c.id);
    setEditContactForm({ name: c.name, role: c.role, phone: c.phone, email: c.email ?? "", location: c.location });
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContactId) return;
    await updateContactMutation.mutateAsync({ id: editingContactId, data: editContactForm });
    setEditingContactId(null);
    setEditContactForm(emptyContactForm);
  };

  const handleDeleteContact = (id: number) => {
    if (confirm("Delete this contact? This cannot be undone.")) {
      deleteContactMutation.mutate(id);
    }
  };

  // ── Small helpers ──────────────────────────────────────────────────────────

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1 text-cyan-400" /> : <ChevronDown className="w-3 h-3 inline ml-1 text-cyan-400" />
      : <ChevronDown className="w-3 h-3 inline ml-1 text-slate-600" />;

  const SkeletonRow = ({ cols }: { cols: number }) => (
    <tr className="border-b border-slate-800/50">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-20" /></td>
      ))}
    </tr>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#080e1a] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0a1220] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Techpack Admin</h1>
            <p className="text-xs text-slate-500">Leads · Orders · Products · Contacts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isRefreshing} data-testid="button-refresh" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={handleLogout} data-testid="button-logout" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-7xl mx-auto">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Leads", value: leads.length, icon: <Users className="w-4 h-4 text-cyan-400" />, loading: isLoadingLeads },
            { label: "Total Orders", value: orders.length, icon: <ShoppingCart className="w-4 h-4 text-purple-400" />, loading: isLoadingOrders },
            { label: "Active Products", value: products.filter((p) => p.isActive).length, icon: <Package className="w-4 h-4 text-green-400" />, loading: isLoadingProducts },
            { label: "Team Contacts", value: contacts.filter((c) => c.isActive).length, icon: <Contact className="w-4 h-4 text-orange-400" />, loading: isLoadingContacts },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d1626] border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-white">{s.loading ? "—" : s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="bg-[#0d1626] border border-slate-800 p-1 mb-6">
            <TabsTrigger value="leads" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              <Users className="w-4 h-4 mr-2" /> Leads
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              <ShoppingCart className="w-4 h-4 mr-2" /> Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              <Package className="w-4 h-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">
              <Contact className="w-4 h-4 mr-2" /> Contacts
            </TabsTrigger>
          </TabsList>

          {/* ── LEADS TAB ── */}
          <TabsContent value="leads" className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input data-testid="input-search-leads" type="text" placeholder="Search by name, phone, or location..." value={leadsSearch} onChange={(e) => setLeadsSearch(e.target.value)} className="w-full bg-[#0d1626] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>
              <button onClick={handleExportLeads} disabled={filteredLeads.length === 0} data-testid="button-export-leads" className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors disabled:opacity-40 whitespace-nowrap">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <div className="bg-[#0d1626] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium"><button onClick={() => toggleSort("name")} className="hover:text-white transition-colors">Name <SortIcon col="name" /></button></th>
                      <th className="text-left px-4 py-3 font-medium">Phone</th>
                      <th className="text-left px-4 py-3 font-medium"><button onClick={() => toggleSort("location")} className="hover:text-white transition-colors">Location <SortIcon col="location" /></button></th>
                      <th className="text-left px-4 py-3 font-medium">Notes</th>
                      <th className="text-left px-4 py-3 font-medium"><button onClick={() => toggleSort("createdAt")} className="hover:text-white transition-colors">Date <SortIcon col="createdAt" /></button></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingLeads ? (
                      Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                    ) : filteredLeads.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500">{leadsSearch ? "No leads match your search." : "No leads captured yet."}</td></tr>
                    ) : filteredLeads.map((lead) => (
                      <tr key={lead.id} data-testid={`row-lead-${lead.id}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{lead.name}</td>
                        <td className="px-4 py-3"><a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"><Phone className="w-3.5 h-3.5" />{lead.phone}</a></td>
                        <td className="px-4 py-3 text-slate-300"><span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />{lead.location}</span></td>
                        <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{lead.notes ?? <span className="text-slate-600 italic">—</span>}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredLeads.length > 0 && <div className="px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500">Showing {filteredLeads.length} of {leads.length} lead{leads.length !== 1 ? "s" : ""}</div>}
            </div>
          </TabsContent>

          {/* ── ORDERS TAB ── */}
          <TabsContent value="orders" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "New", value: orders.filter((o) => o.status === "new").length, color: "text-blue-400" },
                { label: "In Progress", value: orders.filter((o) => o.status === "contacted" || o.status === "quoted").length, color: "text-yellow-400" },
                { label: "Closed", value: orders.filter((o) => o.status === "closed").length, color: "text-green-400" },
              ].map((s) => (
                <div key={s.label} className="bg-[#0d1626] border border-slate-800 rounded-xl p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input data-testid="input-search-orders" type="text" placeholder="Search by customer, phone, or product..." value={ordersSearch} onChange={(e) => setOrdersSearch(e.target.value)} className="w-full bg-[#0d1626] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>
              <button onClick={handleExportOrders} disabled={filteredOrders.length === 0} data-testid="button-export-orders" className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors disabled:opacity-40 whitespace-nowrap">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <div className="bg-[#0d1626] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">Customer</th>
                      <th className="text-left px-4 py-3 font-medium">Phone</th>
                      <th className="text-left px-4 py-3 font-medium">Product</th>
                      <th className="text-left px-4 py-3 font-medium">Qty</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingOrders ? (
                      Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                    ) : filteredOrders.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">{ordersSearch ? "No orders match your search." : "No quote requests yet."}</td></tr>
                    ) : filteredOrders.map((order) => (
                      <tr key={order.id} data-testid={`row-order-${order.id}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{order.customerName}</td>
                        <td className="px-4 py-3"><a href={`tel:${order.phone}`} className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"><Phone className="w-3.5 h-3.5" />{order.phone}</a></td>
                        <td className="px-4 py-3 text-slate-300 max-w-[140px] truncate">{order.productName}</td>
                        <td className="px-4 py-3 text-slate-400">{order.quantity ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v as "new" | "contacted" | "quoted" | "closed")}>
                            <SelectTrigger className={`h-7 w-32 text-xs border rounded-lg px-2 ${statusColors[order.status]} bg-transparent`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0d1626] border-slate-700">
                              {["new", "contacted", "quoted", "closed"].map((s) => <SelectItem key={s} value={s} className="text-white hover:bg-slate-800 capitalize">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length > 0 && <div className="px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500">Showing {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? "s" : ""}</div>}
            </div>
          </TabsContent>

          {/* ── PRODUCTS TAB ── */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input data-testid="input-search-products" type="text" placeholder="Search products..." value={productsSearch} onChange={(e) => setProductsSearch(e.target.value)} className="w-full bg-[#0d1626] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-product" className="bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap">
                    <Plus className="w-4 h-4 mr-2" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[460px] bg-[#0d1626] text-white border-slate-800">
                  <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddProduct}>
                    <ProductFormFields form={addProductForm} setForm={setAddProductForm} />
                    <div className="pt-5 flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => { setIsAddProductOpen(false); setAddProductForm(emptyProductForm); }}>Cancel</Button>
                      <Button type="submit" disabled={isCreatingProduct} className="bg-cyan-600 hover:bg-cyan-500">{isCreatingProduct ? "Saving..." : "Save Product"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Dialog open={editingProductId !== null} onOpenChange={(open) => { if (!open) { setEditingProductId(null); setEditProductForm(emptyProductForm); } }}>
              <DialogContent className="sm:max-w-[460px] bg-[#0d1626] text-white border-slate-800">
                <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
                <form onSubmit={handleEditProduct}>
                  <ProductFormFields form={editProductForm} setForm={setEditProductForm} />
                  <div className="pt-5 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setEditingProductId(null)}>Cancel</Button>
                    <Button type="submit" disabled={isUpdatingProduct} className="bg-cyan-600 hover:bg-cyan-500">{isUpdatingProduct ? "Saving..." : "Update Product"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="bg-[#0d1626] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">Product</th>
                      <th className="text-left px-4 py-3 font-medium">Description</th>
                      <th className="text-left px-4 py-3 font-medium">Category</th>
                      <th className="text-left px-4 py-3 font-medium">Tag</th>
                      <th className="text-center px-4 py-3 font-medium">Visible</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingProducts ? (
                      Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                    ) : filteredProducts.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center"><Package className="w-12 h-12 text-slate-700 mb-3" /><p>{productsSearch ? "No products match." : "No products yet."}</p></div>
                      </td></tr>
                    ) : filteredProducts.map((product) => (
                      <tr key={product.id} data-testid={`row-product-${product.id}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{product.name}</td>
                        <td className="px-4 py-3 text-slate-400 max-w-[240px] truncate" title={product.description}>{product.description}</td>
                        <td className="px-4 py-3 text-slate-400">{product.category || "—"}</td>
                        <td className="px-4 py-3">{product.tag ? <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">{product.tag}</Badge> : <span className="text-slate-600">—</span>}</td>
                        <td className="px-4 py-3 text-center">
                          <button data-testid={`toggle-active-${product.id}`} onClick={() => handleToggleProduct(product)} className="inline-flex items-center transition-colors">
                            {product.isActive ? <ToggleRight className="w-6 h-6 text-green-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditProduct(product)} data-testid={`button-edit-product-${product.id}`} className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} data-testid={`button-delete-product-${product.id}`} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length > 0 && <div className="px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} · {products.filter((p) => p.isActive).length} visible</div>}
            </div>
          </TabsContent>

          {/* ── CONTACTS TAB ── */}
          <TabsContent value="contacts" className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400 flex items-center gap-2">
              <span className="font-semibold">Admin only.</span>
              Contacts you add here will appear on the public website for customers to call. All edits are protected by your admin token.
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input data-testid="input-search-contacts" type="text" placeholder="Search by name, role, phone, or location..." value={contactsSearch} onChange={(e) => setContactsSearch(e.target.value)} className="w-full bg-[#0d1626] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors" />
              </div>
              <button onClick={handleExportContacts} disabled={filteredContacts.length === 0} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors disabled:opacity-40 whitespace-nowrap">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-contact" className="bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap">
                    <Plus className="w-4 h-4 mr-2" /> Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-[#0d1626] text-white border-slate-800">
                  <DialogHeader><DialogTitle>Add Employee Contact</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddContact}>
                    <ContactFormFields form={addContactForm} setForm={setAddContactForm} />
                    <div className="pt-5 flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => { setIsAddContactOpen(false); setAddContactForm(emptyContactForm); }}>Cancel</Button>
                      <Button type="submit" disabled={createContactMutation.isPending} className="bg-cyan-600 hover:bg-cyan-500">{createContactMutation.isPending ? "Saving..." : "Save Contact"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit contact dialog */}
            <Dialog open={editingContactId !== null} onOpenChange={(open) => { if (!open) { setEditingContactId(null); setEditContactForm(emptyContactForm); } }}>
              <DialogContent className="sm:max-w-[500px] bg-[#0d1626] text-white border-slate-800">
                <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
                <form onSubmit={handleEditContact}>
                  <ContactFormFields form={editContactForm} setForm={setEditContactForm} />
                  <div className="pt-5 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setEditingContactId(null)}>Cancel</Button>
                    <Button type="submit" disabled={updateContactMutation.isPending} className="bg-cyan-600 hover:bg-cyan-500">{updateContactMutation.isPending ? "Saving..." : "Update Contact"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="bg-[#0d1626] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">Name</th>
                      <th className="text-left px-4 py-3 font-medium">Role</th>
                      <th className="text-left px-4 py-3 font-medium">Phone</th>
                      <th className="text-left px-4 py-3 font-medium">Email</th>
                      <th className="text-left px-4 py-3 font-medium">Location</th>
                      <th className="text-center px-4 py-3 font-medium">Visible</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingContacts ? (
                      Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                    ) : filteredContacts.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <Contact className="w-12 h-12 text-slate-700" />
                          <p>{contactsSearch ? "No contacts match your search." : "No contacts yet. Add your first employee contact above."}</p>
                        </div>
                      </td></tr>
                    ) : filteredContacts.map((contact) => (
                      <tr key={contact.id} data-testid={`row-contact-${contact.id}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{contact.name}</td>
                        <td className="px-4 py-3 text-slate-300">{contact.role}</td>
                        <td className="px-4 py-3">
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors">
                            <Phone className="w-3.5 h-3.5" />{contact.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-slate-400 max-w-[180px] truncate">{contact.email || <span className="text-slate-600 italic">—</span>}</td>
                        <td className="px-4 py-3 text-slate-400">
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />{contact.location}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            data-testid={`toggle-contact-${contact.id}`}
                            onClick={() => toggleContactMutation.mutate({ contact })}
                            title={contact.isActive ? "Hide from website" : "Show on website"}
                            className="inline-flex items-center transition-colors"
                          >
                            {contact.isActive
                              ? <ToggleRight className="w-6 h-6 text-green-400" />
                              : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditContact(contact)} data-testid={`button-edit-contact-${contact.id}`} className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteContact(contact.id)} data-testid={`button-delete-contact-${contact.id}`} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredContacts.length > 0 && (
                <div className="px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500">
                  {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""} · {contacts.filter((c) => c.isActive).length} visible on website
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
