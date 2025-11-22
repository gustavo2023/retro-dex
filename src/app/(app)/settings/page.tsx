import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Perfil básico</CardTitle>
          <CardDescription>
            Estos campos sincronizarán con tu perfil público cuando la API esté
            lista.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="display-name">Nombre visible</Label>
            <Input id="display-name" placeholder="RetroFan92" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              placeholder="retrofan@email.com"
              disabled
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Avatar</Label>
            <Skeleton className="h-24 w-24 rounded-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled>Guardar cambios</Button>
        </CardFooter>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Preferencias de notificación</CardTitle>
          <CardDescription>
            Define cómo RetroDex se comunicará contigo una vez habilitemos las
            alertas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {["Alertas semanales", "Nuevas colecciones", "Actividad social"].map(
            (label) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium leading-none">{label}</p>
                  <p className="text-sm text-muted-foreground">
                    Próximamente podrás activar o desactivar este canal.
                  </p>
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            )
          )}
        </CardContent>
      </Card>
    </section>
  );
}
