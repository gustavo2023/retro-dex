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
          Check your email inbox
        </CardTitle>
        <CardDescription>
          We have sent you an email to verify your RetroDex account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Open your inbox, find the message we just sent, and click the link to
          confirm your account.
        </p>
        <p>
          You can safely close this window; you&apos;ll return to RetroDex as
          soon as you confirm from your email.
        </p>
      </CardContent>
    </Card>
  );
}
