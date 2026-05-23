import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
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
  getGetLeadsQueryKey,
} from "@workspace/api-client-react";
import {
  LogOut, Users, Phone, MapPin, Search, RefreshCw, Download,
  ChevronUp, ChevronDown, Clock, Package, ShoppingCart,
  Trash2, Plus, Pencil, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type SortKey = "name" | "location" | "createdAt";
type SortDir = "asc" | "desc";

interface ProductFormState {
  name: string;
  description: string;
  category: string;
  tag: string;
}

const emptyForm: ProductFormState = { name: "", description: "", category: "", tag: "" };

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

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [leadsSearch, setLeadsSearch] = useState("");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [productsSearch, setProductsSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Add product dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<ProductFormState>(emptyForm);

  // Edit product dialog
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ProductFormState>(emptyForm);

  useEffect(() => {
    if (!sessionStorage.getItem("tp_admin_auth")) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: leads = [], isLoading: isLoadingLeads, refetch: refetchLeads, isFetching: isFetchingLeads } = useGetLeads();
  const { data: orders = [], isLoading: isLoadingOrders, refetch: refetchOrders, isFetching: isFetchingOrders } = useGetOrders();
  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts, isFetching: isFetchingProducts } = useGetProducts();

  const { mutate: updateOrderStatus } = useUpdateOrderStatus();
  const { mutateAsync: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

  const handleLogout = () => {
    sessionStorage.removeItem("tp_admin_auth");
    setLocation("/admin");
  };

  const handleRefresh = () => { refetchLeads(); refetchOrders(); refetchProducts(); };
  const isRefreshing = isFetchingLeads || isFetchingOrders || isFetchingProducts;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Filtered + sorted leads
  const filteredLeads = leads
    .filter((l) => {
      const q = leadsSearch.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.location.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let av = sortKey === "createdAt" ? new Date(a.createdAt).getTime().toString() : (a[sortKey] ?? "");
      let bv = sortKey === "createdAt" ? new Date(b.createdAt).getTime().toString() : (b[sortKey] ?? "");
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

  // CSV exports
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

  const handleStatusChange = (orderId: number, status: "new" | "contacted" | "quoted" | "closed") => {
    updateOrderStatus({ id: orderId, data: { status } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() }),
    });
  };

  // Add product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.description) return;
    await createProduct({ data: { name: addForm.name, description: addForm.description, category: addForm.category || null, tag: addForm.tag || null, isActive: true } });
    queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
    setIsAddOpen(false);
    setAddForm(emptyForm);
  };

  // Edit product
  const openEdit = (p: { id: number; name: string; description: string; category?: string | null; tag?: string | null }) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, description: p.description, category: p.category ?? "", tag: p.tag ?? "" });
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editForm.name || !editForm.description) return;
    await updateProduct({ id: editingId, data: { name: editForm.name, description: editForm.description, category: editForm.category || null, tag: editForm.tag || null } });
    queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
    setEditingId(null);
    setEditForm(emptyForm);
  };

  // Toggle availability
  const handleToggleActive = (p: { id: number; name: string; description: string; category?: string | null; tag?: string | null; isActive: boolean }) => {
    updateProduct({ id: p.id, data: { name: p.name, description: p.description, category: p.category ?? null, tag: p.tag ?? null, isActive: !p.isActive } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }),
    });
  };

  // Delete product
  const handleDeleteProduct = (id: number) => {
    if (confirm("Delete this product? It will be hidden from customers.")) {
      deleteProduct({ id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }) });
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col
      ? sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1 text-cyan-400" /> : <ChevronDown className="w-3 h-3 inline ml-1 text-cyan-400" />
      : <ChevronDown className="w-3 h-3 inline ml-1 text-slate-600" />;



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
            <p className="text-xs text-slate-500">Leads · Orders · Products</p>
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total Leads", value: leads.length, icon: <Users className="w-4 h-4 text-cyan-400" /> },
            { label: "Total Orders", value: orders.length, icon: <ShoppingCart className="w-4 h-4 text-purple-400" /> },
            { label: "Active Products", value: products.filter((p) => p.isActive).length, icon: <Package className="w-4 h-4 text-green-400" /> },
          ].map((s) => (
            <div key={s.label} className="bg-[#0d1626] border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-white">{isLoadingLeads && isLoadingOrders && isLoadingProducts ? "—" : s.value}</p>
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
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          {Array.from({ length: 5 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-24" /></td>)}
                        </tr>
                      ))
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
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          {Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-20" /></td>)}
                        </tr>
                      ))
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
              {/* Add Product Dialog */}
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-product" className="bg-cyan-600 hover:bg-cyan-500 text-white whitespace-nowrap">
                    <Plus className="w-4 h-4 mr-2" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[460px] bg-[#0d1626] text-white border-slate-800">
                  <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddProduct}>
                    <ProductFormFields form={addForm} setForm={setAddForm} />
                    <div className="pt-5 flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => { setIsAddOpen(false); setAddForm(emptyForm); }}>Cancel</Button>
                      <Button type="submit" disabled={isCreating} className="bg-cyan-600 hover:bg-cyan-500">{isCreating ? "Saving..." : "Save Product"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Product Dialog */}
            <Dialog open={editingId !== null} onOpenChange={(open) => { if (!open) { setEditingId(null); setEditForm(emptyForm); } }}>
              <DialogContent className="sm:max-w-[460px] bg-[#0d1626] text-white border-slate-800">
                <DialogHeader><DialogTitle>Edit Product</DialogTitle></DialogHeader>
                <form onSubmit={handleEditProduct}>
                  <ProductFormFields form={editForm} setForm={setEditForm} />
                  <div className="pt-5 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    <Button type="submit" disabled={isUpdating} className="bg-cyan-600 hover:bg-cyan-500">{isUpdating ? "Saving..." : "Update Product"}</Button>
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
                      <th className="text-center px-4 py-3 font-medium">Available</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingProducts ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          {Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-20" /></td>)}
                        </tr>
                      ))
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center">
                            <Package className="w-12 h-12 text-slate-700 mb-3" />
                            <p>{productsSearch ? "No products match your search." : "No products yet. Add your first product above."}</p>
                          </div>
                        </td>
                      </tr>
                    ) : filteredProducts.map((product) => (
                      <tr key={product.id} data-testid={`row-product-${product.id}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{product.name}</td>
                        <td className="px-4 py-3 text-slate-400 max-w-[240px] truncate" title={product.description}>{product.description}</td>
                        <td className="px-4 py-3 text-slate-400">{product.category || "—"}</td>
                        <td className="px-4 py-3">
                          {product.tag
                            ? <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">{product.tag}</Badge>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            data-testid={`toggle-active-${product.id}`}
                            onClick={() => handleToggleActive(product)}
                            title={product.isActive ? "Click to hide from customers" : "Click to show to customers"}
                            className="inline-flex items-center transition-colors"
                          >
                            {product.isActive
                              ? <ToggleRight className="w-6 h-6 text-green-400" />
                              : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(product)} data-testid={`button-edit-${product.id}`} className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} data-testid={`button-delete-${product.id}`} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredProducts.length > 0 && <div className="px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} · {products.filter((p) => p.isActive).length} active</div>}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
