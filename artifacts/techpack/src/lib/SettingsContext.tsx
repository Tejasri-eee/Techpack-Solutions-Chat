import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { company as defaults } from "./companyConfig";

/**
 * Flat settings object — populated from DB via /api/settings,
 * falling back to companyConfig.ts defaults for any missing key.
 */
export interface CompanySettings {
  name: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  hours: string;
  tagline: string;
  foundedYear: string;
  clients: string;
  experience: string;
  productLines: string;
}

const flatDefaults: CompanySettings = {
  name: defaults.name,
  phone: defaults.phone,
  whatsappNumber: defaults.whatsappNumber,
  email: defaults.email,
  address: defaults.address,
  city: defaults.city,
  hours: defaults.hours,
  tagline: defaults.tagline,
  foundedYear: defaults.stats.foundedYear,
  clients: defaults.stats.clients,
  experience: defaults.stats.experience,
  productLines: defaults.stats.productLines,
};

const SettingsContext = createContext<CompanySettings>(flatDefaults);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery<Record<string, string>>({
    queryKey: ["company-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return {};
      return res.json() as Promise<Record<string, string>>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const merged: CompanySettings = {
    ...flatDefaults,
    ...(data ?? {}),
  };

  return (
    <SettingsContext.Provider value={merged}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): CompanySettings {
  return useContext(SettingsContext);
}
