# Exibir “Em breve” na vitrine pública

## Objetivo
Neutralizar as ações comerciais diretamente na página que aparece no preview, mantendo os produtos e preços visíveis.

## Alterações
1. Na vitrine pública, substituir o botão comercial de cada produto por **“Em breve”**.
2. Fazer o clique nesse botão abrir `https://wa.me/5562996075522` em nova aba.
3. Impedir que o clique no botão seja capturado pelo card e redirecione para landing, cadastro ou checkout.
4. Manter os cards, preços, descrições, trials e links institucionais sem alterações de texto.
5. Preservar a navegação para conhecer o produto pelo restante do card; apenas a ação comercial será neutralizada.

## Verificação
- Conferir no preview mobile e desktop que “Em breve” aparece nos cards.
- Clicar no botão e confirmar a abertura do WhatsApp sem redirecionamento interno.
- Confirmar que Termos, Privacidade e Reembolso permanecem intactos.

## Detalhes técnicos
- Arquivo principal: `src/pages/Vitrine.tsx`.
- A vitrine atual ainda mostra preço/trial nos cards (`Vitrine.tsx:293-296`) e o card navega para a landing (`Vitrine.tsx:247-259`); por isso as mudanças feitas somente nas páginas internas não aparecem na tela atual.
