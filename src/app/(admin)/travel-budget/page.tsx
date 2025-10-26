import type { Metadata } from "next";
import TravelBudgetTracker from "@/components/travel/TravelBudgetTracker";

export const metadata: Metadata = {
  title: "Travel Budget Tracker | TailAdmin",
  description: "Track your travel expenses and manage your budget",
};

export default function TravelBudgetPage() {
  return <TravelBudgetTracker />;
}