import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Valor total",
            description: "Placeholder para el valor estimado de la colección",
          },
          {
            title: "Películas vistas",
            description: "Conteo del año en curso",
          },
          {
            title: "Géneros favoritos",
            description: "Top géneros por cantidad",
          },
        ].map((card) => (
          <Card key={card.title} className="border-dashed">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Gráficos y métricas</CardTitle>
          <CardDescription>
            Aquí vivirán los gráficos de colección, géneros y progreso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
