# Regras de execução (priorizar economia de contexto)

## Roteamento de ferramentas
- Cliente, tarefa, processo, atendimento, Radar e-CAC -> usar SOMENTE o conector Nibo_Contador.
- Erro de Domínio, PVA, SPED, EFD -> skill dominio-contabil-especialista.
- IRPF -> skill especialista-irpf2026. Ganho de capital -> skill gcap-especialista.
- Rescisão -> skill rescisao-clt-especialista. Contrato social/alteração -> skill legalista-contratos-empresariais.
- E-mail/calendário -> Microsoft_365. Arquivos -> Google_Drive.
- NÃO usar Picsart, Cloudflare, subagentes ou pesquisa web, salvo pedido explícito.

## Eficiência
- Não explorar o repositório inteiro; ler só os arquivos citados.
- Não criar subagentes sem pedido.
- Respostas curtas, sem recapitulação.
- Ação irreversível (emitir documento oficial, enviar e-mail, apagar): confirmar antes. O resto, executar direto.
