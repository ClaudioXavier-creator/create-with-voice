import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface WhatsAppAlertProps {
  empresa_nome?: string
  instance_name?: string
  status?: string
  status_anterior?: string
  detectado_em?: string
  portal_url?: string
}

const WhatsAppAlertEmail = ({
  empresa_nome = '—',
  instance_name = '—',
  status = 'desconectado',
  status_anterior = 'conectado',
  detectado_em = new Date().toLocaleString('pt-BR'),
  portal_url = 'https://www.bpfconsult.com.br/admin?tab=whatsapp',
}: WhatsAppAlertProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>WhatsApp desconectado — ação necessária</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⚠️ WhatsApp desconectado</Heading>
        <Text style={text}>
          O gateway WhatsApp/Evolution da sua conta parou de responder. Enquanto estiver
          desconectado, alertas críticos e envios automáticos não chegarão ao seu celular.
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Empresa:</strong> {empresa_nome}</Text>
          <Text style={row}><strong>Instância:</strong> {instance_name}</Text>
          <Text style={row}><strong>Status atual:</strong> {status}</Text>
          <Text style={row}><strong>Status anterior:</strong> {status_anterior}</Text>
          <Text style={row}><strong>Detectado em:</strong> {detectado_em}</Text>
        </Section>
        <Text style={text}>
          <strong>Como reconectar:</strong>
          <br />1. Acesse <a href={portal_url} style={link}>{portal_url}</a>
          <br />2. Clique em <strong>"Forçar novo QR Code"</strong>
          <br />3. Escaneie o QR no WhatsApp em até 40 segundos
          <br />4. Teste com <strong>"Enviar teste agora"</strong>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Monitor automático BPF_Consult · Enviamos este alerta somente quando o status muda.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WhatsAppAlertEmail,
  subject: (data: Record<string, any>) =>
    `⚠️ WhatsApp desconectado — ${data?.empresa_nome ?? 'sua conta'}`,
  displayName: 'Alerta: WhatsApp desconectado',
  previewData: {
    empresa_nome: 'BPF Consult',
    instance_name: 'bpfconsult-02',
    status: 'close',
    status_anterior: 'open',
    detectado_em: new Date().toLocaleString('pt-BR'),
    portal_url: 'https://www.bpfconsult.com.br/admin?tab=whatsapp',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '20px', fontWeight: 'bold', color: '#b91c1c', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px' }
const card = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 16px',
}
const row = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const link = { color: '#2563eb', textDecoration: 'underline' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '8px 0 0' }
