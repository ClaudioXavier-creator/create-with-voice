# Configuração do Monitoramento de Erros (Sentry)

Para ativar o monitoramento de produção e receber alertas por e-mail quando ocorrerem falhas no cadastro, siga estes passos:

1.  Crie uma conta gratuita em [sentry.io](https://sentry.io).
2.  Crie um novo projeto "React" ou "Vite".
3.  Copie o **DSN** fornecido (ex: `https://...`).
4.  Adicione a seguinte variável de ambiente no seu painel do Lovable ou arquivo `.env.production`:
    ```env
    VITE_SENTRY_DSN=SEU_DSN_AQUI
    ```

O sistema já está preparado para enviar erros automaticamente assim que esta chave for configurada.
