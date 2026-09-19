# Zelda Stock Monitor

> **Projeto de monitoramento pessoal e informativo. Não é um bot de compra e não executa qualquer forma de invasão ou evasão de controles.**

Monitor de disponibilidade para o Console Zelda e o Controle Pro nas páginas públicas da Amazon e do Mercado Livre.

## Finalidade

Este projeto foi criado exclusivamente para **monitoramento pessoal de disponibilidade de estoque**. Ele consulta páginas públicas em intervalos controlados e envia uma notificação quando encontra sinais de que um produto voltou a ficar disponível.

## O que este projeto não faz

- Não realiza compras automaticamente.
- Não adiciona produtos ao carrinho.
- Não acessa contas de clientes ou dados privados.
- Não captura credenciais ou informações de pagamento.
- Não burla CAPTCHA, bloqueios, filas, limites ou controles de acesso.
- Não interfere nos sistemas das lojas.
- Não executa técnicas de exploração, invasão ou evasão.

Se uma loja bloquear ou limitar a consulta, o monitor registra o resultado como **bloqueado** ou **incerto** e não tenta contornar a proteção.

## Uso responsável

Quem executar este projeto deve respeitar os termos de uso, políticas e limites técnicos de cada loja. Os links monitorados continuam pertencendo às respectivas plataformas e vendedores.

## Funcionamento

O serviço verifica quatro anúncios públicos, mantém um histórico visual e exige duas confirmações consecutivas antes de enviar um alerta, reduzindo falsos positivos. O painel é protegido por um token definido como variável de ambiente.

## Segurança

Tokens do painel e do canal de mensagens devem ser configurados apenas como variáveis secretas na hospedagem. Nenhuma credencial deve ser adicionada ao repositório.
