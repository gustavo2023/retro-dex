import DashboardGrid from "@/components/dashboard/dashboard-grid";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-muted-foreground">
          Overview of your collection statistics and metrics.
        </p>
      </div>

      <DashboardGrid />
    </section>
  );
}
