/**
 * Dicionário centralizado das mensagens do sistema Gerto.
 * Fonte da verdade: docs/casos_de_uso.md — tópico 4 "Mensagens de sucesso e erro".
 * Os identificadores e textos são oficiais e NÃO devem ser alterados.
 * Marcadores entre colchetes ([Nome], [ID] ...) são substituídos em tempo de execução por formatMessage().
 */
export const MESSAGES = {
  MSG01: 'Olá, [Nome]! Login realizado com sucesso.',
  MSG02: 'Erro: Sem conexão com a internet. Verifique sua rede e tente novamente.',
  MSG03: 'Erro: E-mail ou senha incorretos. Tente novamente.',
  MSG04: 'Acesso negado: Sua conta encontra-se inativa ou sem permissão de acesso. Entre em contato com o suporte.',
  MSG05: 'Código de redefinição enviado para o e-mail cadastrado.',
  MSG06: 'Senha redefinida com sucesso! Efetue o login com sua nova senha.',
  MSG07: 'Registro salvo com sucesso!',
  MSG08: 'Registro atualizado com sucesso!',
  MSG09: 'Tem certeza de que deseja inativar este registro?',
  MSG10: 'Registro inativado com sucesso!',
  MSG11: 'Erro: Não foi possível carregar os registros. Tente novamente em instantes.',
  MSG12: 'Atenção: Preencha todos os campos obrigatórios marcados com (*).',
  MSG13: 'Erro: Um veículo com esta placa (ou motorista com esta CNH) já está cadastrado no sistema.',
  MSG14: 'Serviço agendado com sucesso!',
  MSG15: 'Ficha de serviço atualizada com sucesso!',
  MSG16: 'Erro: Falha ao carregar motoristas e veículos. Verifique a conexão.',
  MSG17: 'Erro: A data e horário de início do serviço não podem ser anteriores ao momento atual.',
  MSG18: 'Erro: Não foi possível carregar a agenda de serviços. Toque para tentar novamente.',
  MSG19: 'Nenhum serviço agendado para a data selecionada.',
  MSG20: 'Conflito de Agenda: O veículo [Modelo/Placa] (ou Motorista) já possui o serviço nº [ID] agendado entre [Hora Início] e [Hora Fim]. Altere o horário ou selecione outro recurso.',
  MSG21: 'Nenhum serviço ou veículo encontrado com as etiquetas selecionadas.',
  MSG22: 'Limpar filtros e exibir todos os registros.',
  MSG23: 'Erro: Não foi possível localizar o serviço selecionado. Escolha outro registro na listagem.',
  MSG24: 'Erro: Não foi possível gerar o resumo do serviço no momento. Tente novamente.',
  MSG25: 'Erro: Não foi possível carregar o histórico de serviços. Toque para tentar novamente.',
  MSG26: 'Erro: Não foi possível carregar os detalhes deste atendimento.',
  MSG27: 'Dados atualizados e sincronizados com sucesso!',
  MSG28: 'Erro: Sem conexão com a internet. Não foi possível sincronizar as alterações.',
  MSG29: 'Erro: Falha na sincronização com o servidor. Os demais dispositivos podem estar desatualizados.',
  MSG30: 'Lançamento financeiro registrado e resumo atualizado com sucesso!',
  MSG31: 'Ainda não existem receitas ou despesas registradas para este atendimento.',
  MSG32: 'Erro: Não foi possível carregar os dados financeiros. Tente novamente.',
  MSG33: 'Erro: Falha ao processar o resumo financeiro deste serviço.',
  MSG34: 'Dados insuficientes para exibir este indicador no período atual.',
  MSG35: 'Erro: Não foi possível carregar os dados do Dashboard. Toque para tentar novamente.',
  MSG36: 'Erro: Falha ao apresentar os indicadores operacionais na tela.',
  MSG37: 'Nenhum registro financeiro encontrado para o período selecionado.',
  MSG38: 'Erro: Não foi possível recuperar os registros financeiros do período.',
  MSG39: 'Erro: Falha ao gerar o relatório financeiro analítico. Tente novamente.',
  MSG40: 'Template de documento cadastrado com sucesso!',
  MSG41: 'Template atualizado com sucesso!',
  MSG42: 'Erro: Não foi possível carregar os templates cadastrados.',
  MSG43: 'Erro: Não foi possível salvar o novo template. Verifique os campos e tente novamente.',
  MSG44: 'Erro: Falha ao salvar as alterações do template. Os dados anteriores foram mantidos.',
  MSG45: 'Erro: Não foi possível carregar as informações do modelo selecionado.',
  MSG46: 'Contrato assinado eletronicamente e status atualizado com sucesso!',
  MSG47: 'Erro: O contrato selecionado não foi localizado no sistema.',
  MSG48: 'Erro: Não foi possível carregar os dados deste contrato.',
  MSG49: 'Erro: Falha ao processar a assinatura eletrônica. Tente novamente.',
  MSG50: 'Erro: Não foi possível atualizar o status do contrato no momento.',
  MSG51: 'Não há registros suficientes para compor este indicador contábil.',
  MSG52: 'Erro: Não foi possível carregar as informações financeiras para a contabilidade.',
  MSG53: 'Erro: Falha ao consolidar os indicadores contábeis.',
  MSG54: 'Erro: Não foi possível carregar o Dashboard Contábil.',
};

/** Mensagens de caráter informativo (estado vazio / ausência de dados). */
const INFO = new Set(['MSG09', 'MSG19', 'MSG21', 'MSG22', 'MSG31', 'MSG34', 'MSG37', 'MSG51']);

/** Classifica o tom visual da mensagem a partir do seu texto oficial. */
export function messageTone(code) {
  const text = MESSAGES[code] || '';
  if (INFO.has(code)) return 'info';
  if (text.startsWith('Erro') || text.startsWith('Acesso negado') || text.startsWith('Conflito')) return 'error';
  if (text.startsWith('Atenção')) return 'warning';
  return 'success';
}

/**
 * Retorna o texto oficial com os marcadores substituídos.
 * Ex.: formatMessage('MSG01', { Nome: 'Lucas' })
 */
export function formatMessage(code, params = {}) {
  let text = MESSAGES[code];
  if (!text) return code;
  Object.entries(params).forEach(([key, value]) => {
    text = text.split(`[${key}]`).join(String(value));
  });
  return text;
}
