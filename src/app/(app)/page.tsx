import { EntriesList } from "@/components/home/entries-list";
import { HomeHeader } from "@/components/home/home-header";
import { StreakBanner } from "@/components/home/streak-banner";
import { WeekStrip } from "@/components/home/week-strip";

export default function HomePage() {
  return (
    <>
      <HomeHeader />
      <WeekStrip />
      <StreakBanner />
      <EntriesList />
    </>
  );
}
