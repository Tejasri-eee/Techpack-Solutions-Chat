import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetLeads, 
  useGetOrders, 
  useUpdateOrderStatus, 
  useGetProducts, 
  useCreateProduct, 
  useDeleteProduct,
  getGetProductsQueryKey,
  getGetOrdersQueryKey
} from "@workspace/api-client-react";
import {
  LogOut,
  Users,
  Phone,
  MapPin,
  Search,
  RefreshCw,
  Download,
  ChevronUp,
  ChevronDown,
  Clock,
  Package,
  ShoppingCart,
  Trash2,
  Plus
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  quoted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  closed: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Form state for add product
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductTag, setNewProductTag] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("tp_admin_auth")) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: leads = [], isLoading: isLoadingLeads, refetch: refetchLeads, isFetching: isFetchingLeads } = useGetLeads();
  const { data: orders = [], isLoading: isLoadingOrders, refetch: refetchOrders, isFetching: isFetchingOrders } = useGetOrders();
  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts, isFetching: isFetchingProducts } = useGetProducts();
  
  const { mutate: updateOrderStatus } = useUpdateOrderStatus();
  const { mutateAsync: createProduct, isPending: isCreatingProduct } = useCreateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

  const handleLogout = () => {
    sessionStorage.removeItem("tp_admin_auth");
    setLocation("/admin");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredLeads = leads
    .filter((l) => {
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let av = a[sortKey] ?? "";
      let bv = b[sortKey] ?? "";
      if (sortKey === "createdAt") {
        av = new Date(av as string).getTime().toString();
        bv = new Date(bv as string).getTime().toString();
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.phone.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q)
    );
  });

  const handleExportLeadsCSV = () => {
    const header = "Name,Phone,Location,Notes,Date\n";
    const rows = filteredLeads
      .map((l) => `"${l.name}","${l.phone}","${l.location}","${l.notes ?? ""}","${formatDate(l.createdAt)}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `techpack-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportOrdersCSV = () => {
    const header = "Customer,Phone,Location,Product,Quantity,Status,Notes,Date\n";
    const rows = filteredOrders
      .map((o) => `"${o.customerName}","${o.phone}","${o.location}","${o.productName}","${o.quantity ?? ""}","${o.status}","${o.notes ?? ""}","${formatDate(o.createdAt)}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `techpack-orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = (orderId: number, status: "new" | "contacted" | "quoted" | "closed") => {
    updateOrderStatus({ id: orderId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
      }
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductDesc) return;
    
    await createProduct({
      data: {
        name: newProductName,
        description: newProductDesc,
        category: newProductCategory || null,
        tag: newProductTag || null,
        isActive: true
      }
    });
    
    queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
    setIsAddProductOpen(false);
    setNewProductName("");
    setNewProductDesc("");
    setNewProductCategory("");
    setNewProductTag("");
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() })
      });
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === "asc" ? (
        <ChevronUp className="w-3 h-3 inline ml-1 text-cyan-400" />
      ) : (
        <ChevronDown className="w-3 h-3 inline ml-1 text-cyan-400" />
      )
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1 text-slate-600" />
    );

  const isRefreshing = isFetchingLeads || isFetchingOrders || isFetchingProducts;
  
  const handleRefresh = () => {
    refetchLeads();
    refetchOrders();
    refetchProducts();
  };

  return (
    <div className="min-h-screen bg-[#080e1a] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0a1220] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Techpack Admin</h1>
            <p className="text-xs text-slate-500">Manage Leads, Orders, and Products</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-7xl mx-auto">
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

          <TabsContent value="leads" className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Total Leads",
                  value: leads.length,
                  icon: <Users className="w-4 h-4 text-cyan-400" />,
                },
                {
                  label: "This Week",
                  value: leads.filter((l) => {
                    const d = new Date(l.createdAt);
                    const now = new Date();
                    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
                    return diff <= 7;
                  }).length,
                  icon: <Clock className="w-4 h-4 text-purple-400" />,
                },
                {
                  label: "Unique Cities",
                  value: new Set(leads.map((l) => l.location.trim().toLowerCase())).size,
                  icon: <MapPin className="w-4 h-4 text-green-400" />,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#0d1626] border border-slate-800 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{isLoadingLeads ? "—" : stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Search & Export */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search leads by name, phone, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0d1626] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <button
                onClick={handleExportLeadsCSV}
                disabled={filteredLeads.length === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors disabled:opacity-40"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            {/* Table */}
            <div className="bg-[#0d1626] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">
                        <button onClick={() => toggleSort("name")} className="hover:text-white transition-colors">
                          Name <SortIcon col="name" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 font-medium">Phone</th>
                      <th className="text-left px-4 py-3 font-medium">
                        <button onClick={() => toggleSort("location")} className="hover:text-white transition-colors">
                          Location <SortIcon col="location" />
                        </button>
                      </th>
                      <th className="text-left px-4 py-3 font-medium">Notes</th>
                      <th className="text-left px-4 py-3 font-medium">
                        <button onClick={() => toggleSort("createdAt")} className="hover:text-white transition-colors">
                          Date <SortIcon col="createdAt" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingLeads ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          {Array.from({ length: 5 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-24" /></td>
                          ))}
                        </tr>
                      ))
                    ) : filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                          {search ? "No leads match your search." : "No leads captured yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">{lead.name}</td>
                          <td className="px-4 py-3">
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300">
                              <Phone className="w-3.5 h-3.5" />{lead.phone}
                            </a>
                          </td>
                          <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-slate-300"><MapPin className="w-3.5 h-3.5 text-slate-500" />{lead.location}</span></td>
                          <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{lead.notes ?? <span className="text-slate-600 italic">—</span>}</td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
             {/* Stats row */}
             <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Total Orders",
                  value: orders.length,
                  icon: <ShoppingCart className="w-4 h-4 text-cyan-400" />,
                },
                {
                  label: "New Requests",
                  value: orders.filter((o) => o.status === "new").length,
                  icon: <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/20 border-0">New</Badge>,
                },
                {
                  label: "Closed Deals",
                  value: orders.filter((o) => o.status === "closed").length,
                  icon: <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/20 border-0">Closed</Badge>,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-[#0d1626] border border-slate-800 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{isLoadingOrders ? "—" : stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Search & Export */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search orders by customer, phone, or product..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0d1626] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <button
                onClick={handleExportOrdersCSV}
                disabled={filteredOrders.length === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors disabled:opacity-40"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            {/* Table */}
            <div className="bg-[#0d1626] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">Customer</th>
                      <th className="text-left px-4 py-3 font-medium">Contact</th>
                      <th className="text-left px-4 py-3 font-medium">Product / Qty</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingOrders ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          {Array.from({ length: 5 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-24" /></td>
                          ))}
                        </tr>
                      ))
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                          {search ? "No orders match your search." : "No quote requests yet."}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">{order.customerName}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-cyan-400">{order.phone}</span>
                              <span className="text-xs text-slate-500">{order.location}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                             <div className="flex flex-col">
                              <span className="text-white">{order.productName}</span>
                              {order.quantity && <span className="text-xs text-slate-500">Qty: {order.quantity}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Select 
                              defaultValue={order.status} 
                              onValueChange={(val: any) => handleStatusChange(order.id, val)}
                            >
                              <SelectTrigger className={`h-8 w-[130px] border text-xs capitalize ${statusColors[order.status as keyof typeof statusColors]}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0a1220] border-slate-700 text-white">
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="quoted">Quoted</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Product Catalog</h2>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-[#0d1626] text-white border-slate-800">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input 
                        id="name" 
                        required 
                        value={newProductName} 
                        onChange={(e) => setNewProductName(e.target.value)} 
                        className="bg-[#0a1220] border-slate-700" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Description *</Label>
                      <Textarea 
                        id="desc" 
                        required 
                        value={newProductDesc} 
                        onChange={(e) => setNewProductDesc(e.target.value)} 
                        className="bg-[#0a1220] border-slate-700" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input 
                          id="category" 
                          value={newProductCategory} 
                          onChange={(e) => setNewProductCategory(e.target.value)} 
                          className="bg-[#0a1220] border-slate-700" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tag">Tag (e.g. Top Seller)</Label>
                        <Input 
                          id="tag" 
                          value={newProductTag} 
                          onChange={(e) => setNewProductTag(e.target.value)} 
                          className="bg-[#0a1220] border-slate-700" 
                        />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setIsAddProductOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isCreatingProduct} className="bg-cyan-600 hover:bg-cyan-500">
                        {isCreatingProduct ? "Saving..." : "Save Product"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-[#0d1626] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-medium">Product</th>
                      <th className="text-left px-4 py-3 font-medium">Description</th>
                      <th className="text-left px-4 py-3 font-medium">Category</th>
                      <th className="text-left px-4 py-3 font-medium">Tags</th>
                      <th className="text-right px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingProducts ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          {Array.from({ length: 5 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-800 animate-pulse w-24" /></td>
                          ))}
                        </tr>
                      ))
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center">
                            <Package className="w-12 h-12 text-slate-700 mb-3" />
                            <p>No products yet. Add your first product above.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">{product.name}</td>
                          <td className="px-4 py-3 text-slate-400 max-w-[300px] truncate" title={product.description}>
                            {product.description}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{product.category || "—"}</td>
                          <td className="px-4 py-3">
                            {product.tag ? (
                              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                                {product.tag}
                              </Badge>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
