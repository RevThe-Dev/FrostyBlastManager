import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface CompanySettings {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  vatNumber: string;
}

// Default settings - will be replaced when data is loaded
const defaultSettings: CompanySettings = {
  companyName: "Frosty's Ice Blasting Solutions LTD",
  address: "123 Snowflake Street, Frostville, FV1 2IB",
  phone: "+44 1234 567890",
  email: "info@frostysblasting.co.uk",
  website: "https://www.frostysblasting.co.uk",
  vatNumber: "GB123456789",
};

interface CompanySettingsContextType {
  settings: CompanySettings;
  isLoading: boolean;
  error: Error | null;
  updateSettings: (newSettings: CompanySettings) => void;
}

export const CompanySettingsContext = createContext<CompanySettingsContextType | null>(null);

export function CompanySettingsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);

  // Fetch company settings
  const {
    data: fetchedSettings,
    error,
    isLoading,
  } = useQuery<CompanySettings>({
    queryKey: ["/api/company-settings"],
    queryFn: getCompanySettingsFallback,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update state when data is loaded
  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: CompanySettings) => {
      const res = await apiRequest("PUT", "/api/company-settings", newSettings);
      return await res.json();
    },
    onSuccess: (newSettings: CompanySettings) => {
      setSettings(newSettings);
      queryClient.setQueryData(["/api/company-settings"], newSettings);
      toast({
        title: "Settings updated",
        description: "Company settings have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to get company settings with fallback
  async function getCompanySettingsFallback() {
    try {
      const res = await apiRequest("GET", "/api/company-settings");
      if (!res.ok) {
        // For development/demo, return default settings if endpoint doesn't exist
        if (res.status === 404) {
          return defaultSettings;
        }
        throw new Error("Failed to fetch company settings");
      }
      return await res.json();
    } catch (error) {
      // Return default settings as fallback
      console.warn("Using default company settings:", error);
      return defaultSettings;
    }
  }

  const updateSettings = (newSettings: CompanySettings) => {
    updateSettingsMutation.mutate(newSettings);
  };

  return (
    <CompanySettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        updateSettings,
      }}
    >
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings() {
  const context = useContext(CompanySettingsContext);
  if (!context) {
    throw new Error("useCompanySettings must be used within a CompanySettingsProvider");
  }
  return context;
}