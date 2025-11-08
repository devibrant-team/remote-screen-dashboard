import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { GetProfileApi } from "../../API/API";

export type Plan = {
  plan_id: number;
  plan_name: string;
  extra_screens: number;
  extra_space: string; // "0.00"
  num_screen: number;
  used_screen: number;
  storage: string; // "1000.00"
  used_storage: string; // "167.89"
  expire_date: string; // "2025-09-30"
  payment_type: string; // "visa"
};

export type Profile = {
  id: number;
  name: string | null;
  email: string;
  country: string;
  verified: boolean;
  plan: Plan | null; // or just Plan if it's always present
};
export const PROFILE_QK = ["profile"] as const;

async function fetchProfile(): Promise<Profile> {
  const token = localStorage.getItem("token");

  const res = await axios.get<Profile>(GetProfileApi, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  return res.data;
}

export function useGetProfile() {
  return useQuery<Profile, Error>({
    queryKey: PROFILE_QK,
    queryFn: fetchProfile,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
