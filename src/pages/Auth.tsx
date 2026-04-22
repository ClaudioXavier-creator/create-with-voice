import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Loader2, Building2, Briefcase, Eye, EyeOff } from "lucide-react";
import logoImg from "@/assets/logo.png";
import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const authConfigs = {
  default: {
    logo: logoImg,
    title: "BPF_Consult",
    subtitle: "Acesse sua plataforma de gestão e conformidade.",
  },
  feedbpf: {
    logo: logoFeedBpf,
    title: "Feed_BPF",
    subtitle: "Sistema de Gestão de Boas Práticas de Fabricação",
  },
  "audits-bpf": {
    logo: logoAuditsBpf,
    title: "Audits_BPF",
    subtitle: "Sistema de auditoria interna para BPF em nutrição animal",
  },
} as const;

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const product = searchParams.get("product") ?? "default";
  const mode = searchParams.get("mode");
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const authContent = authConfigs[product as keyof typeof authConfigs] ?? authConfigs.default;

  const [isLogin, setIsLogin] = useState(mode !== "signup");
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nome, setNome] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<"cliente" | "consultoria">("cliente");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const passwordChecks = useMemo(
    () => [
      { label: "Mínimo de 8 caracteres", valid: password.length >= 8 },
      { label: "Pelo menos 1 letra", valid: /[A-Za-zÀ-ÿ]/.test(password) },
      { label: "Pelo menos 1 número", valid: /\d/.test(password) },
    ],
    [password],
  );

  useEffect(() => {
    setIsForgot(mode === "forgot");
    setIsLogin(mode !== "signup");
  }, [mode]);

  const updateAuthMode = (next: { login?: boolean; forgot?: boolean }) => {
    const nextIsForgot = next.forgot ?? isForgot;
    const nextIsLogin = next.login ?? isLogin;

    setIsForgot(nextIsForgot);
    setIsLogin(nextIsLogin);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("mode", nextIsForgot ? "forgot" : nextIsLogin ? "login" : "signup");
    if (!nextParams.get("product")) nextParams.set("product", product);
    if (redirectTo) nextParams.set("redirect", redirectTo);
    setSearchParams(nextParams, { replace: true });
  };

  const getAuthErrorMessage = (error: { message?: string }) => {
    const message = error.message?.toLowerCase() ?? "";

    if (message.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
    if (message.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
    if (message.includes("user already registered")) return "Este e-mail já está cadastrado.";
    if (message.includes("password should be at least")) return "Use uma senha mais forte, com pelo menos 8 caracteres.";
    if (message.includes("unable to validate email address") || message.includes("invalid email")) return "Digite um e-mail válido.";

    return error.message || "Erro na autenticação.";
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = z.string().trim().email().safeParse(email);
    if (!emailResult.success) {
      toast.error("Digite um e-mail válido.");
      return;
    }

    if (!isForgot && !isLogin) {
      const signUpSchema = z.object({
        nome: z.string().trim().min(3, "Informe seu nome completo.").max(120, "Nome muito longo."),
        password: z
          .string()
          .min(8, "A senha deve ter pelo menos 8 caracteres.")
          .regex(/[A-Za-zÀ-ÿ]/, "A senha deve conter pelo menos uma letra.")
          .regex(/\d/, "A senha deve conter pelo menos um número."),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "As senhas não coincidem.",
        path: ["confirmPassword"],
      });

      const parsed = signUpSchema.safeParse({ nome, password, confirmPassword });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Revise os dados informados.");
        return;
      }
    }

    if (isLogin && !isForgot && password.length < 1) {
      toast.error("Digite sua senha para continuar.");
      return;
    }

    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Link enviado. Confira sua caixa de entrada e spam.");
        updateAuthMode({ forgot: false, login: true });
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate(redirectTo, { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nome: nome.trim(), tipo_usuario: tipoUsuario },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
        updateAuthMode({ login: true, forgot: false });
      }
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <img src={authContent.logo} alt={`${authContent.title} Logo`} className="w-20 h-20 object-contain" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{authContent.title}</h1>
            <p className="text-sm text-muted-foreground">{authContent.subtitle}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
              {googleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4">
                <path fill="#4285F4" d="M21.805 10.023H12v3.955h5.617c-.496 2.512-2.632 3.955-5.617 3.955a6.227 6.227 0 1 1 0-12.455c1.77 0 3.347.672 4.576 1.773l2.985-2.985A10.52 10.52 0 0 0 12 1.5C6.201 1.5 1.5 6.201 1.5 12S6.201 22.5 12 22.5c5.25 0 10.023-3.814 10.023-10.5 0-.709-.077-1.386-.218-1.977Z" />
                <path fill="#34A853" d="M3.733 7.846 6.983 10.23A6.227 6.227 0 0 1 12 5.478c1.77 0 3.347.672 4.576 1.773l2.985-2.985A10.52 10.52 0 0 0 12 1.5 10.49 10.49 0 0 0 3.733 7.846Z" />
                <path fill="#FBBC05" d="M1.5 12c0 1.693.403 3.291 1.118 4.707l3.775-2.92A6.182 6.182 0 0 1 5.773 12c0-.622.093-1.224.266-1.787l-3.775-2.92A10.458 10.458 0 0 0 1.5 12Z" />
                <path fill="#EA4335" d="M12 22.5c2.84 0 5.222-.93 6.963-2.516l-3.385-2.62c-.951.638-2.167 1.024-3.578 1.024-2.973 0-5.111-1.432-5.617-3.935l-3.746 2.89A10.497 10.497 0 0 0 12 22.5Z" />
              </svg>
              Entrar com Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou continue com e-mail</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>Tipo de acesso</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoUsuario("cliente")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          tipoUsuario === "cliente"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <Building2 className="w-6 h-6" />
                      <span className="text-sm font-medium">Cliente</span>
                      <span className="text-xs text-muted-foreground text-center">Fábrica / Unidade</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoUsuario("consultoria")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                          tipoUsuario === "consultoria"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <Briefcase className="w-6 h-6" />
                      <span className="text-sm font-medium">Consultoria</span>
                      <span className="text-xs text-muted-foreground text-center">Assessoria técnica</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      placeholder="Seu nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </>
            )}
              <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>
            {!isForgot && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "Digite sua senha" : "Crie uma senha segura"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    minLength={isLogin ? 1 : 8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!isLogin && (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {passwordChecks.map((item) => (
                      <li key={item.label} className={item.valid ? "text-primary" : undefined}>
                        {item.valid ? "✓" : "•"} {item.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {!isLogin && !isForgot && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            {isForgot && (
              <p className="text-xs text-muted-foreground">
                Enviaremos um link seguro para redefinir sua senha. Se não chegar em alguns minutos, verifique a pasta de spam.
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isForgot ? "Enviar link de recuperação" : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {isLogin && !isForgot && (
              <button
                type="button"
                onClick={() => updateAuthMode({ forgot: true, login: true })}
                className="block w-full text-sm text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            )}
            {isForgot ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => updateAuthMode({ forgot: false, login: true })}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  Voltar para o login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void (async () => {
                      const emailResult = z.string().trim().email().safeParse(email);
                      if (!emailResult.success) {
                        toast.error("Digite um e-mail válido.");
                        return;
                      }

                      setLoading(true);
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        toast.success("Novo link enviado. Confira sua caixa de entrada e spam.");
                      } catch (error: any) {
                        toast.error(getAuthErrorMessage(error));
                      } finally {
                        setLoading(false);
                      }
                    })();
                  }}
                  className="block w-full text-sm text-primary hover:underline"
                >
                  Reenviar link
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => updateAuthMode({ login: !isLogin, forgot: false })}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
