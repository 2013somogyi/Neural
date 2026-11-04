export const subscriptionPlans = [
  {
    id: 'basico',
    name: 'Básico',
    price: 89.9,
    priceLabel: 'R$ 89,90',
    description: 'O essencial para organizar sua assistência.',
    features: [
      'Limite mensal na quantidade de Ordens de Serviço',
      'Acesso às funcionalidades essenciais',
      'Funcionalidades Pro bloqueadas'
    ],
    featured: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 189.9,
    priceLabel: 'R$ 189,90',
    description: 'Mais recursos e liberdade para crescer.',
    features: [
      'Emissão ilimitada de Ordens de Serviço',
      'Acesso completo aos recursos avançados',
      'Suporte prioritário'
    ],
    featured: true
  }
];

export function getSubscriptionPlan(planId) {
  return subscriptionPlans.find(plan => plan.id === planId) || subscriptionPlans[0];
}
