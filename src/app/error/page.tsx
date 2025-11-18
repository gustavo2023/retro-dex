import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <CardTitle className="text-amber-500 text-lg">
            Algo salió mal
          </CardTitle>
          <CardDescription>
            Ocurrió un error inesperado mientras procesábamos tu solicitud.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No pudimos completar el proceso de crear tu cuenta o iniciar sesión.
            Por favor, inténtalo de nuevo en unos momentos.
          </p>
          <Button asChild className="w-full bg-amber-500">
            <Link href="/login">Volver a intentar</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
