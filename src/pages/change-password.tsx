import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, ArrowLeft } from "lucide-react";

export default function ChangePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsPending(false);
      return;
    }

    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Error al cambiar la contraseña");
    }

    setIsPending(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-[#171717]">
        <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl w-full max-w-sm">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-[rgba(62,207,142,0.1)] border border-[#3ecf8e]/20 flex items-center justify-center mb-2">
              <Lock className="size-6 text-[#3ecf8e]" />
            </div>
            <CardTitle className="text-lg text-[#fafafa] text-center">
              ¡Contraseña actualizada!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-[#b4b4b4] mb-4">
              Tu contraseña fue cambiada correctamente.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full px-6 h-10 w-full"
            >
              Volver al inicio
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
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-[#898989] hover:text-[#fafafa] mb-2"
          >
            <ArrowLeft className="size-3" />
            Volver
          </Link>
          <img
            src="/logo-completo.png"
            alt="LotTrack"
            className="h-10 mx-auto mb-3"
          />
          <CardTitle className="text-lg text-[#fafafa]">
            Cambiar contraseña
          </CardTitle>
          <p className="text-xs text-[#898989]">
            Actualizá tu contraseña de acceso
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              name="currentPassword"
              type="password"
              placeholder="Contraseña actual"
              required
              minLength={6}
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-10 text-sm"
            />
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
                "Cambiar contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
