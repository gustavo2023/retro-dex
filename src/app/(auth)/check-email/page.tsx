import { MailCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <MailCheck className="mx-auto h-10 w-10 text-amber-500" />
        <CardTitle className="text-amber-500 text-lg">
          Revisa tu bandeja de entrada
        </CardTitle>
        <CardDescription>
          Te enviamos un correo para verificar tu cuenta de RetroDex.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Abre tu bandeja de entrada, busca el mensaje que acabamos de enviar y
          haz clic en el enlace para confirmar tu cuenta.
        </p>
        <p>
          Puedes cerrar esta ventana con total seguridad; volverás a RetroDex en
          cuanto confirmes desde tu correo.
        </p>
      </CardContent>
    </Card>
  );
}
