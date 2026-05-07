import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { register } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const password = formData.get("password") as string;

    const result = await register(email, nombre, apellido, password);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Error al registrarse");
    }

    setIsPending(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-[#171717]">
        <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#fafafa] text-center">
              ¡Revisá tu correo!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-[#b4b4b4] mb-4">
              Te enviamos un email de verificación. Hacé click en el link para
              activar tu cuenta.
            </p>
            <Link to="/login">
              <Button className="bg-[#3ecf8e] hover:bg-[#35b57a] text-[#0f0f0f] font-medium rounded-full px-6 h-10 w-full">
                Ir a login
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
          <img
            src="/logo-completo.png"
            alt="LotTrack"
            className="h-30 mx-auto mb-3"
          />
          <CardTitle className="text-lg text-[#fafafa]">
            Crear cuenta
          </CardTitle>
          <p className="text-xs text-[#898989]">
            Registrate para empezar a usar LotTrack
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="nombre"
                placeholder="Nombre"
                required
                className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-10 text-sm"
              />
              <Input
                name="apellido"
                placeholder="Apellido"
                required
                className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-10 text-sm"
              />
            </div>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-10 text-sm"
            />
            <Input
              name="password"
              type="password"
              placeholder="Contraseña (mínimo 6 caracteres)"
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
                "Registrarse"
              )}
            </Button>

            <p className="text-xs text-[#898989] text-center">
              ¿Ya tenés cuenta?{" "}
              <Link to="/login" className="text-[#3ecf8e] hover:underline">
                Iniciá sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
