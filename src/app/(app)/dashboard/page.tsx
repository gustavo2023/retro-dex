import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DashboardGrid from "@/components/dashboard/dashboard-grid";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your collection statistics and metrics.
        </p>
      </div>

      <DashboardGrid />
    </section>
  );
}
