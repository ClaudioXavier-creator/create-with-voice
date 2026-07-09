import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Clock,
} from "lucide-react";

/**
 * Boas práticas e limites seguros para campanhas em massa via WhatsApp.
 * Exibido no topo do Disparador de Marketing para orientar o gestor
 * antes de qualquer envio em lote — evita ban do número na Meta.
 */
export function BoasPraticasWhatsApp() {
  const [aberto, setAberto] = useState(true);

  return (
    <Card className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <ShieldCheck className="h-5 w-5" />
            Boas práticas para campanhas em massa (WhatsApp)
            <Badge variant="outline" className="border-amber-400 text-amber-800">
              Leia antes de disparar
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAberto((v) => !v)}
            aria-label={aberto ? "Recolher" : "Expandir"}
          >
            {aberto ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {aberto && (
        <CardContent className="space-y-5 text-sm">
          {/* Limites seguros */}
          <section>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-700" />
              Limites diários seguros
            </h4>
            <div className="overflow-x-auto rounded-md border border-amber-200 bg-background">
              <table className="w-full text-xs">
                <thead className="bg-amber-100/70 dark:bg-amber-900/30">
                  <tr className="text-left">
                    <th className="p-2">Situação do número</th>
                    <th className="p-2">Máx. por dia</th>
                    <th className="p-2">Intervalo entre msgs</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:not(:last-child)]:border-b [&_tr]:border-amber-100">
                  <tr>
                    <td className="p-2">Chip novo (menos de 30 dias)</td>
                    <td className="p-2 font-medium">20 a 50</td>
                    <td className="p-2">30 a 60 segundos</td>
                  </tr>
                  <tr>
                    <td className="p-2">Chip aquecido (1 a 3 meses)</td>
                    <td className="p-2 font-medium">100 a 300</td>
                    <td className="p-2">15 a 30 segundos</td>
                  </tr>
                  <tr>
                    <td className="p-2">Chip antigo + WhatsApp Business</td>
                    <td className="p-2 font-medium">500 a 1000</td>
                    <td className="p-2">8 a 15 segundos</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-amber-800 mt-2 flex items-start gap-1">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                <strong>Nunca</strong> dispare 100 mensagens em 5 minutos — é ban quase certo pela Meta.
              </span>
            </p>
          </section>

          {/* Boas práticas obrigatórias */}
          <section>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-700" />
              Regras obrigatórias antes de qualquer disparo
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-foreground/90">
              <li>
                <strong>Só envie para quem deu opt-in</strong> (leads cadastrados, clientes ativos).
                Lista comprada = ban.
              </li>
              <li>
                <strong>Personalize</strong> — comece com o nome: <code className="bg-muted px-1 rounded">Olá {"{{nome}}"}, ...</code>.
                Mensagens 100% idênticas em massa são sinalizadas automaticamente.
              </li>
              <li>
                <strong>Varie o texto</strong> — tenha 3 a 5 versões da mesma mensagem e alterne entre contatos.
              </li>
              <li>
                <strong>Intervalo aleatório</strong> entre envios (ex.: 15 a 45 segundos randômico, não fixo).
              </li>
              <li>
                <strong>Divida em janelas</strong> — dispare 20/hora ao longo do dia, nunca 200 de uma vez.
              </li>
              <li>
                <strong>Horário comercial</strong> (9h às 18h, dia útil). Envio às 3h da manhã é bandeira vermelha.
              </li>
              <li>
                <strong>Sempre com opt-out</strong>: inclua <em>"Responda SAIR para não receber mais."</em>
              </li>
              <li>
                <strong>Monitore respostas</strong> — se vários pedirem "sair" ou reclamarem, <strong>pare imediatamente</strong>.
              </li>
              <li>
                <strong>Aqueça o chip</strong>: nas 2 primeiras semanas, envie devagar (10 a 20/dia) para
                contatos que respondem.
              </li>
              <li>
                <strong>Sem links suspeitos</strong> — encurtadores como <code className="bg-muted px-1 rounded">bit.ly</code> e
                domínios novos são penalizados. Use sempre <code className="bg-muted px-1 rounded">bpfconsult.com.br</code>.
              </li>
            </ol>
          </section>

          {/* O que NÃO fazer */}
          <section>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <Ban className="h-4 w-4 text-red-700" />
              O que <span className="underline">nunca</span> fazer
            </h4>
            <ul className="list-disc list-inside space-y-1 text-foreground/90">
              <li>Enviar para números que não solicitaram contato.</li>
              <li>Copiar e colar a mesma mensagem para 500 pessoas.</li>
              <li>Disparos noturnos, finais de semana ou feriados.</li>
              <li>Links de terceiros, downloads ou promessas milagrosas.</li>
              <li>Ignorar pedidos de "sair" / "descadastrar".</li>
            </ul>
          </section>

          <p className="text-xs text-muted-foreground border-t border-amber-200 pt-3">
            💡 O monitor automático do WhatsApp avisa por e-mail sempre que o gateway cair.
            Se você notar aumento de reclamações ou opt-outs, <strong>pause a campanha</strong>{" "}
            imediatamente para preservar o número.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
