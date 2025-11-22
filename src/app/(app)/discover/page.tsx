import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const mockCollections = [
  {
    title: "Visionados recientes",
    description: "Historias que la comunidad está revisitando",
  },
  {
    title: "Clásicos que regresan",
    description: "Películas que no pasan de moda",
  },
  {
    title: "Listas colaborativas",
    description: "Construidas por curadores invitados",
  },
];

export default function DiscoverPage() {
  return (
    <section className="space-y-8">
      <Card className="border-dashed">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Explora nuevas gemas retro</CardTitle>
            <CardDescription>
              Usa filtros, colecciones y recomendaciones sociales para descubrir
              tu próxima obsesión.
            </CardDescription>
          </div>
          <Button size="lg" variant="default">
            Abrir buscador avanzado
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {mockCollections.map((collection) => (
          <Card key={collection.title} className="border-dashed">
            <CardHeader>
              <CardTitle>{collection.title}</CardTitle>
              <CardDescription>{collection.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
