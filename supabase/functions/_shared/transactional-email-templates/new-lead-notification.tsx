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

const SITE_NAME = 'BPF_Consult'

interface NewLeadProps {
  nome?: string
  email?: string
  telefone?: string
  produto?: string
  origem?: string
  data?: string
}

const NewLeadNotificationEmail = ({
  nome = '—',
  email = '—',
  telefone = '—',
  produto = '—',
  origem = '—',
  data = new Date().toLocaleString('pt-BR'),
}: NewLeadProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Novo lead cadastrado: {nome}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🌱 Novo lead — {SITE_NAME}</Heading>
        <Text style={text}>
          Um novo cadastro foi realizado na plataforma. Detalhes abaixo:
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Nome:</strong> {nome}</Text>
          <Text style={row}><strong>E-mail:</strong> {email}</Text>
          <Text style={row}><strong>WhatsApp / Telefone:</strong> {telefone}</Text>
          <Text style={row}><strong>Produto de interesse:</strong> {produto}</Text>
          <Text style={row}><strong>Origem:</strong> {origem}</Text>
          <Text style={row}><strong>Data:</strong> {data}</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Notificação automática enviada pela plataforma {SITE_NAME}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewLeadNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Novo lead: ${data?.nome ?? 'sem nome'} (${data?.produto ?? 'plataforma'})`,
  displayName: 'Notificação de novo lead',
  previewData: {
    nome: 'João da Silva',
    email: 'joao@exemplo.com',
    telefone: '+55 11 99999-9999',
    produto: 'Feed_BPF',
    origem: '/demo/feedbpf',
    data: new Date().toLocaleString('pt-BR'),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const h1 = { fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 16px' }
const card = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 16px',
}
const row = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '8px 0 0' }
