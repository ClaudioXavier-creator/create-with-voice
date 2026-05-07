/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface CrmMessageData {
  assunto: string
  corpo_html: string
  remetente_nome?: string
}

const CrmMessage = ({ assunto, corpo_html, remetente_nome }: CrmMessageData) => (
  <Html>
    <Head />
    <Preview>{assunto}</Preview>
    <Body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f6f9f6', margin: 0, padding: '24px' }}>
      <Container style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px', maxWidth: '600px' }}>
        <Heading style={{ color: '#1f4d2b', fontSize: '20px', marginTop: 0 }}>{assunto}</Heading>
        <Section>
          <div dangerouslySetInnerHTML={{ __html: corpo_html }} />
        </Section>
        {remetente_nome ? (
          <Text style={{ color: '#666', fontSize: '13px', marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
            Atenciosamente,<br />{remetente_nome}<br />BPF Consult
          </Text>
        ) : null}
      </Container>
    </Body>
  </Html>
)

export const template: TemplateEntry = {
  component: CrmMessage,
  subject: (data) => (data?.assunto as string) || 'Mensagem da BPF Consult',
  displayName: 'CRM — Mensagem personalizada',
  previewData: {
    assunto: 'Olá, tudo bem?',
    corpo_html: '<p>Vi seu interesse em nossa plataforma e gostaria de entender melhor sua operação.</p>',
    remetente_nome: 'Equipe Comercial',
  },
}
