import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function AuthConfirmedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[#171717]">
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl w-full max-w-sm">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-[rgba(62,207,142,0.1)] border border-[#3ecf8e]/20 flex items-center justify-center mb-2">
            <CheckCircle2 className="size-6 text-[#3ecf8e]" />
          </div>
          <CardTitle className="text-lg text-[#fafafa] text-center">
            ¡Email verificado!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-[#b4b4b4] mb-4">
            Tu cuenta fue confirmada correctamente. Ya podés iniciar sesión.
          </p>
          <Link to="/login">
            <Button className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full px-6 h-10 w-full">
              Iniciar sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
