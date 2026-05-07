import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsPending(false);
      return;
    }

    const result = await resetPassword(newPassword);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Error al restablecer la contraseña");
    }

    setIsPending(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-[#171717]">
        <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl w-full max-w-sm">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-[rgba(62,207,142,0.1)] border border-[#3ecf8e]/20 flex items-center justify-center mb-2">
              <CheckCircle2 className="size-6 text-[#3ecf8e]" />
            </div>
            <CardTitle className="text-lg text-[#fafafa] text-center">
              ¡Contraseña restablecida!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-[#b4b4b4] mb-4">
              Tu contraseña fue cambiada correctamente. Ya podés iniciar sesión
              con tu nueva contraseña.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full px-6 h-10 w-full"
            >
              Ir a login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[#171717]">
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-10 h-10 rounded-lg bg-[rgba(62,207,142,0.1)] border border-[#3ecf8e]/20 flex items-center justify-center mb-2">
            <Lock className="size-5 text-[#3ecf8e]" />
          </div>
          <CardTitle className="text-lg text-[#fafafa]">
            Nueva contraseña
          </CardTitle>
          <p className="text-xs text-[#898989]">
            Creá tu nueva contraseña de acceso
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              name="newPassword"
              type="password"
              placeholder="Nueva contraseña (mínimo 6 caracteres)"
              required
              minLength={6}
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-10 text-sm"
            />
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirmar nueva contraseña"
              required
              minLength={6}
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
                "Restablecer contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
