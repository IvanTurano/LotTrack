import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await login(email, password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Error al iniciar sesión");
    }

    setIsPending(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[#171717]">
      <Card className="border-[#2e2e2e] bg-[#171717] rounded-xl w-full max-w-sm">
        <CardHeader className="text-center">
          <img
            src="/logo-completo.png"
            alt="LotTrack"
            className="h-10 mx-auto mb-3"
          />
          <CardTitle className="text-lg text-[#fafafa]">
            Iniciar sesión
          </CardTitle>
          <p className="text-xs text-[#898989]">
            Ingresá a tu cuenta de LotTrack
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              placeholder="Contraseña"
              required
              className="bg-[#0f0f0f] border-[#2e2e2e] text-[#fafafa] h-10 text-sm"
            />

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-[#898989] hover:text-[#3ecf8e] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

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
                "Iniciar sesión"
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
