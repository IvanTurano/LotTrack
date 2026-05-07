import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const result = await forgotPassword(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Error al enviar el email");
    }

    setIsPending(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-[#171717]">
        <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl w-full max-w-sm">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-[rgba(62,207,142,0.1)] border border-[#3ecf8e]/20 flex items-center justify-center mb-2">
              <Mail className="size-6 text-[#3ecf8e]" />
            </div>
            <CardTitle className="text-lg text-[#fafafa] text-center">
              ¡Email enviado!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-[#b4b4b4] mb-4">
              Te enviamos un email con un link para restablecer tu contraseña.
              Revisá tu bandeja de entrada y spam.
            </p>
            <Link to="/login">
              <Button className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full px-6 h-10 w-full">
                Volver a login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[#171717]">
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl w-full max-w-sm">
        <CardHeader className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs text-[#898989] hover:text-[#fafafa] mb-2"
          >
            <ArrowLeft className="size-3" />
            Volver a login
          </Link>
          <img
            src="/logo-completo.png"
            alt="LotTrack"
            className="h-10 mx-auto mb-3"
          />
          <CardTitle className="text-lg text-[#fafafa]">
            Recuperar contraseña
          </CardTitle>
          <p className="text-xs text-[#898989]">
            Te enviaremos un email para restablecer tu contraseña
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              name="email"
              type="email"
              placeholder="Tu email"
              required
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-10 text-sm"
            />

            {error && (
              <p className="text-xs text-[#ef4444] bg-[rgba(239,68,68,0.1)] border border-[#ef4444]/20 rounded-lg p-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full h-10 w-full disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Enviar email"
              )}
            </Button>

            <p className="text-xs text-[#898989] text-center">
              ¿No tenés cuenta?{" "}
              <Link to="/register" className="text-[#3ecf8e] hover:underline">
                Registrate
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
