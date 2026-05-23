import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetLeads } from "@workspace/api-client-react";
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
} from "lucide-react";

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

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Guard: redirect if not authenticated
  useEffect(() => {
    if (!sessionStorage.getItem("tp_admin_auth")) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: leads = [], isLoading, refetch, isFetching } = useGetLeads();

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

  const filtered = leads
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

  const handleExportCSV = () => {
    const header = "Name,Phone,Location,Notes,Date\n";
    const rows = filtered
      .map(
        (l) =>
          `"${l.name}","${l.phone}","${l.location}","${l.notes ?? ""}","${formatDate(l.createdAt)}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `techpack-leads-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  return (
    <div className="min-h-screen bg-[#080e1a] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0a1220] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Lead Manager</h1>
            <p className="text-xs text-slate-500">Techpack Solutions — Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="button-refresh-leads"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            data-testid="button-export-csv"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-7xl mx-auto">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
                <p className="text-2xl font-bold text-white">{isLoading ? "—" : stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            data-testid="input-search-leads"
            type="text"
            placeholder="Search by name, phone, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d1626] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-[#0d1626] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">
                    <button
                      onClick={() => toggleSort("name")}
                      className="hover:text-white transition-colors"
                    >
                      Name <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">
                    <button
                      onClick={() => toggleSort("location")}
                      className="hover:text-white transition-colors"
                    >
                      Location <SortIcon col="location" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                  <th className="text-left px-4 py-3 font-medium">
                    <button
                      onClick={() => toggleSort("createdAt")}
                      className="hover:text-white transition-colors"
                    >
                      Date <SortIcon col="createdAt" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 rounded bg-slate-800 animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      {search ? "No leads match your search." : "No leads captured yet. They'll appear here once customers chat."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      data-testid={`row-lead-${lead.id}`}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-white">{lead.name}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {lead.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {lead.location}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                        {lead.notes ?? <span className="text-slate-600 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500">
              Showing {filtered.length} of {leads.length} lead{leads.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
