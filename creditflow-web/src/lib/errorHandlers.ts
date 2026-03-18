export interface LimitErrorHandler {
  title: string;
  message: string;
}

export function handleLimitError(error: any, entityType: 'usuarios' | 'rutas' | 'clientes'): LimitErrorHandler {
  if (error.response?.status !== 403) {
    return {
      title: 'Error',
      message: error.response?.data?.message || `Error al guardar ${entityType.slice(0, -1)}`
    };
  }

  const message = error.response.data?.message || '';
  
  // Extraer el límite del mensaje
  const limitMatch = message.match(/allows (\d+)/);
  const currentMatch = message.match(/have (\d+)/);
  
  const limit = limitMatch ? limitMatch[1] : 'permitido';
  const current = currentMatch ? currentMatch[1] : '';

  const entityLabels = {
    usuarios: { singular: 'usuario', plural: 'usuarios' },
    rutas: { singular: 'ruta', plural: 'rutas' },
    clientes: { singular: 'cliente', plural: 'clientes' }
  };

  const labels = entityLabels[entityType];
  
  return {
    title: '🚫 Límite alcanzado',
    message: `Has alcanzado el límite de ${limit} ${labels.plural} de tu plan actual${current ? ` (tienes ${current})` : ''}. Para crear más ${labels.plural}, actualiza tu plan.`
  };
}

export function handleApiError(error: any, defaultMessage: string = 'Ha ocurrido un error'): LimitErrorHandler {
  if (error.response?.status === 403 && error.response.data?.message?.includes('limit reached')) {
    // Es un error de límite, pero no sabemos de qué tipo
    return {
      title: '🚫 Límite alcanzado',
      message: 'Has alcanzado el límite de tu plan actual. Actualiza tu plan para continuar.'
    };
  }

  return {
    title: 'Error',
    message: error.response?.data?.message || defaultMessage
  };
}