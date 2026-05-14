import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Loader2, Building2, Briefcase, Eye, EyeOff, AlertTriangle, MailCheck, Phone } from "lucide-react";
import logoImg from "@/assets/logo.png";
import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoNutricrm from "@/assets/logo-nutricrm.png";
import logoAgrogestao from "@/assets/logo-agrogestao.png";
import logoAgrorc from "@/assets/logo-agrorc.png";
import logoRotulos from "@/assets/logo-rotulos-bpf.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { lovable } from "@/integrations/lovable";
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
  "auditsbpf": {
    logo: logoAuditsBpf,
    title: "Audits_BPF",
    subtitle: "Auditoria interna (Decreto 12.031/2024)",
  },
  nutricrm: {
    logo: logoNutricrm,
    title: "NutriCRM",
    subtitle: "CRM especializado para nutrição animal",
  },
  agrogestao: {
    logo: logoAgrogestao,
    title: "AgroGestão CRM",
    subtitle: "CRM para gestão regional de vendas no agronegócio",
  },
  agrorc: {
    logo: logoAgrorc,
    title: "Agro RC CRM",
    subtitle: "CRM para Representantes Comerciais do agronegócio",
  },
  rotulos: {
    logo: logoRotulos,
    title: "Nutri_Agro Labels",
    subtitle: "Gerador de rótulos para nutrição animal",
  },
  admin: {
    logo: logoImg,
    title: "Portal de Gestão",
    subtitle: "Gestão central de leads e licenças BPF_Consult",
  },
} as const;

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const product = searchParams.get("product") ?? "default";
  const mode = searchParams.get("mode");
  const redirectTo = searchParams.get("redirect") || "/";
  const authContent = authConfigs[product as keyof typeof authConfigs] ?? authConfigs.default;

  const [isLogin, setIsLogin] = useState(mode !== "signup");
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<"cliente" | "consultoria">("cliente");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const resolvedRedirect = useMemo(() => {
    if (redirectTo && redirectTo !== "/") return redirectTo;
    return "/";
  }, [redirectTo]);

  const preferredRedirect = useMemo(() => {
    const postLoginRedirect = sessionStorage.getItem("post_login_redirect");
    if (redirectTo && redirectTo !== "/") return redirectTo;
    if (postLoginRedirect && postLoginRedirect !== "/auth") return postLoginRedirect;
    return "/";
  }, [redirectTo]);

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const postLoginRedirect = sessionStorage.getItem("post_login_redirect");
        if (postLoginRedirect) sessionStorage.removeItem("post_login_redirect");
        navigate(preferredRedirect, { replace: true });
      }
    });
  }, [navigate, preferredRedirect]);

  const updateAuthMode = (next: { login?: boolean; forgot?: boolean }) => {
    const nextIsForgot = next.forgot ?? isForgot;
    const nextIsLogin = next.login ?? isLogin;

    setIsForgot(nextIsForgot);
    setIsLogin(nextIsLogin);

    const nextParams = new URLSearchParams();
    nextParams.set("mode", nextIsForgot ? "forgot" : nextIsLogin ? "login" : "signup");
    nextParams.set("product", product);
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

  const handlePasswordKeyState = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(event.getModifierState("CapsLock"));
  };

  const resendConfirmationEmail = async () => {
    const emailResult = z.string().trim().email().safeParse(pendingConfirmationEmail || email);
    if (!emailResult.success) {
      toast.error("Digite um e-mail válido.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailResult.data,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      toast.success("E-mail de confirmação reenviado.");
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth?product=${encodeURIComponent(product)}&redirect=${encodeURIComponent(preferredRedirect)}`,
        extraParams: {
          prompt: "select_account",
        },
      });

      if (result.error) throw result.error;

       if (!result.redirected) {
         navigate(preferredRedirect, { replace: true });
       }
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
        telefone: z
          .string()
          .trim()
          .min(8, "Informe um telefone/WhatsApp válido.")
          .max(30, "Telefone muito longo.")
          .refine((v) => v.replace(/\D/g, "").length >= 8, "Informe um telefone/WhatsApp válido."),
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

      const parsed = signUpSchema.safeParse({ nome, telefone, password, confirmPassword });
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
        const postLoginRedirect = sessionStorage.getItem("post_login_redirect");
        if (postLoginRedirect) sessionStorage.removeItem("post_login_redirect");
        navigate(preferredRedirect, { replace: true });
      } else {
        if (product === "admin") {
          toast.error("O cadastro para o Portal de Gestão é restrito. Utilize outro programa para criar sua conta.");
          setLoading(false);
          return;
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nome: nome.trim(), telefone: telefone.trim(), tipo_usuario: tipoUsuario, produto: product === "auditsbpf" ? "auditsbpf" : product },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        // Registra lead + envia notificação por e-mail (não bloqueante)
        try {
          const sourceParam = searchParams.get("source") || "Trial";
          await supabase.functions.invoke("notify-new-lead", {
            body: {
              nome: nome.trim(),
              email: email.trim(),
              telefone: telefone.trim(),
              produto: product !== "default" ? product : "plataforma",
              origem: sourceParam,
              user_id: signUpData.user?.id,
            },
          });
        } catch (err) {
          console.warn("notify-new-lead falhou (não bloqueante):", err);
        }

        setPendingConfirmationEmail(email);
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md border-none sm:border-solid shadow-none sm:shadow-premium bg-transparent sm:bg-card">
        <CardHeader className="text-center space-y-4 pb-2 pt-6">
          <div className="flex justify-center transition-transform hover:scale-105 duration-300">
            <img src={authContent.logo} alt={`${authContent.title} Logo`} className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{authContent.title}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-4">{authContent.subtitle}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingConfirmationEmail && !isForgot && isLogin && (
              <div className="rounded-lg border border-border bg-secondary/60 p-3 text-sm">
                <div className="flex items-start gap-3">
                  <MailCheck aria-hidden="true" className="mt-0.5 h-4 w-4 text-primary" />
                  <div className="space-y-2">
                    <p className="font-medium">Confirme seu e-mail para entrar</p>
                    <p className="text-muted-foreground">
                      Enviamos um link para <span className="text-foreground">{pendingConfirmationEmail}</span>. Se não encontrar, verifique o spam.
                    </p>
                    <button type="button" onClick={resendConfirmationEmail} className="text-primary hover:underline" disabled={loading}>
                      Reenviar e-mail de confirmação
                    </button>
                  </div>
                </div>
              </div>
            )}
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
            {product === "admin" && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
                <p>Este portal é restrito à equipe interna da BPF_Consult. Se você é um cliente, utilize os links específicos do seu programa.</p>
              </div>
            )}
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>Tipo de acesso</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoUsuario("cliente")}
                      aria-pressed={tipoUsuario === "cliente"}
                      className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 ${
                          tipoUsuario === "cliente"
                            ? "border-primary bg-primary/10 text-primary shadow-inner"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <Building2 aria-hidden="true" className="w-5 h-5 sm:w-6 sm:h-6" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Cliente</span>
                        <span className="text-[10px] opacity-70 hidden sm:block">Fábrica</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoUsuario("consultoria")}
                      aria-pressed={tipoUsuario === "consultoria"}
                      className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-95 ${
                          tipoUsuario === "consultoria"
                            ? "border-primary bg-primary/10 text-primary shadow-inner"
                            : "border-border hover:border-muted-foreground/30 hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <Briefcase aria-hidden="true" className="w-5 h-5 sm:w-6 sm:h-6" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">Consultor</span>
                        <span className="text-[10px] opacity-70 hidden sm:block">Assessoria</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <div className="relative">
                    <User aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                  <div className="relative">
                    <Phone aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      type="tel"
                      inputMode="tel"
                      placeholder="(11) 99999-9999"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Usado apenas para contato comercial e suporte.
                  </p>
                </div>
              </>
            )}
              <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                   <Lock aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "Digite sua senha" : "Crie uma senha segura"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handlePasswordKeyState}
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
                    {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                  </button>
                </div>
                {capsLockOn && (
                  <div className="flex items-center gap-2 text-xs text-accent-foreground">
                    <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 text-accent" />
                    <span className="text-muted-foreground">Caps Lock está ativado.</span>
                  </div>
                )}
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
                  <Lock aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyUp={handlePasswordKeyState}
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
                    {showConfirmPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
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
