// hooks/useUserPlan.js
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export default function useUserPlan() {
  const { isSignedIn, user } = useUser();
  const userId = user?.id;

  const enabled = isSignedIn && !!userId;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user-plan", userId],
    queryFn: async () => {
      const res = await fetch("/api/user/plan");
      if (!res.ok) throw new Error("Failed to fetch user plan");
      return res.json();
    },
    enabled,
    onError: (e) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error fetching plan:", e);
      }
    }
  });

  if (!enabled) {
    return {
      plan: "expired",
      trialEnd: null,
      isPro: false,
      isTrial: false,
      isExpired: true,
      daysLeft: 0,
      isLoading: false,
      canGenerate: false,
      refreshPlan: () => {}
    };
  }

  const plan = data?.plan || "trial";
  const trialEnd = data?.trial_end_date || null;
  const isPro = plan === "pro";
  const isTrial =
    plan === "trial" && !!trialEnd && Date.now() <= new Date(trialEnd).getTime();
  const isExpired =
    plan === "expired" ||
    (plan === "trial" && trialEnd && Date.now() > new Date(trialEnd).getTime());
  const canGenerate = isPro || isTrial;

  const daysLeft = isTrial
    ? Math.max(
        0,
        Math.ceil(
          (new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return {
    plan,
    trialEnd,
    isPro,
    isTrial,
    isExpired,
    daysLeft,
    isLoading,
    canGenerate,
    refreshPlan: refetch
  };
}

