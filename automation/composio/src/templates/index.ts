import { MessageTemplate } from '../types';

export const templates: Record<string, Record<string, MessageTemplate>> = {
  // Property Match Templates
  property_match: {
    en: {
      id: 'property_match_en',
      key: 'property_match',
      category: 'property',
      language: 'en',
      body: `🏠 Perfect Match Found!

Hello {{investor_name}},

We found a property matching your preferences:

📍 {{property_title}}
Location: {{property_location}}

💰 Price: {{property_price}}
🛏️ Bedrooms: {{property_bedrooms}}
🚿 Bathrooms: {{property_bathrooms}}
📐 Area: {{property_area}} sqft

{{property_description}}

Your top agent {{agent_name}} is ready to help!
📞 {{agent_phone}}

View details: {{property_link}}

Would you like to schedule a viewing?`,
      variables: [
        'investor_name',
        'property_title',
        'property_location',
        'property_price',
        'property_bedrooms',
        'property_bathrooms',
        'property_area',
        'property_description',
        'agent_name',
        'agent_phone',
        'property_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    es: {
      id: 'property_match_es',
      key: 'property_match',
      category: 'property',
      language: 'es',
      body: `🏠 ¡Coincidencia Perfecta Encontrada!

Hola {{investor_name}},

Encontramos una propiedad que coincide con tus preferencias:

📍 {{property_title}}
Ubicación: {{property_location}}

💰 Precio: {{property_price}}
🛏️ Dormitorios: {{property_bedrooms}}
🚿 Baños: {{property_bathrooms}}
📐 Área: {{property_area}} sqft

{{property_description}}

Tu agente {{agent_name}} está listo para ayudarte!
📞 {{agent_phone}}

Ver detalles: {{property_link}}

¿Te gustaría programar una visualización?`,
      variables: [
        'investor_name',
        'property_title',
        'property_location',
        'property_price',
        'property_bedrooms',
        'property_bathrooms',
        'property_area',
        'property_description',
        'agent_name',
        'agent_phone',
        'property_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },

  // Booking Confirmation Templates
  booking_confirmation: {
    en: {
      id: 'booking_confirmation_en',
      key: 'booking_confirmation',
      category: 'booking',
      language: 'en',
      body: `✅ Booking Confirmed!

Hello {{investor_name}},

Your viewing has been confirmed:

📍 {{property_title}}
{{property_address}}

📅 Date: {{viewing_date}}
⏰ Time: {{viewing_time}}
⏱️ Duration: {{viewing_duration}} minutes

🤝 Agent: {{agent_name}}
📞 {{agent_phone}}
📧 {{agent_email}}

📋 Pre-viewing tips:
- Arrive 5 minutes early
- Bring ID
- Prepare your questions

Add to calendar: {{calendar_link}}

See you soon!`,
      variables: [
        'investor_name',
        'property_title',
        'property_address',
        'viewing_date',
        'viewing_time',
        'viewing_duration',
        'agent_name',
        'agent_phone',
        'agent_email',
        'calendar_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    es: {
      id: 'booking_confirmation_es',
      key: 'booking_confirmation',
      category: 'booking',
      language: 'es',
      body: `✅ ¡Reserva Confirmada!

Hola {{investor_name}},

Tu visualización ha sido confirmada:

📍 {{property_title}}
{{property_address}}

📅 Fecha: {{viewing_date}}
⏰ Hora: {{viewing_time}}
⏱️ Duración: {{viewing_duration}} minutos

🤝 Agente: {{agent_name}}
📞 {{agent_phone}}
📧 {{agent_email}}

📋 Consejos previos a la visualización:
- Llega 5 minutos antes
- Trae tu ID
- Prepara tus preguntas

Añadir al calendario: {{calendar_link}}

¡Nos vemos pronto!`,
      variables: [
        'investor_name',
        'property_title',
        'property_address',
        'viewing_date',
        'viewing_time',
        'viewing_duration',
        'agent_name',
        'agent_phone',
        'agent_email',
        'calendar_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },

  // Viewing Reminder Templates
  viewing_reminder_24h: {
    en: {
      id: 'viewing_reminder_24h_en',
      key: 'viewing_reminder_24h',
      category: 'reminder',
      language: 'en',
      body: `⏰ Reminder: Your Viewing Tomorrow!

Hello {{investor_name}},

Your property viewing is coming up:

📍 {{property_title}}
{{property_address}}

📅 Tomorrow at {{viewing_time}}
⏱️ Duration: {{viewing_duration}} minutes

Need to reschedule?
📞 {{agent_phone}}
💬 Reply to this message

Looking forward to seeing you!`,
      variables: [
        'investor_name',
        'property_title',
        'property_address',
        'viewing_time',
        'viewing_duration',
        'agent_phone',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    es: {
      id: 'viewing_reminder_24h_es',
      key: 'viewing_reminder_24h',
      category: 'reminder',
      language: 'es',
      body: `⏰ Recordatorio: ¡Tu Visualización Mañana!

Hola {{investor_name}},

Tu visualización de propiedad se aproxima:

📍 {{property_title}}
{{property_address}}

📅 Mañana a {{viewing_time}}
⏱️ Duración: {{viewing_duration}} minutos

¿Necesitas reprogramar?
📞 {{agent_phone}}
💬 Responde este mensaje

¡Esperamos verte!`,
      variables: [
        'investor_name',
        'property_title',
        'property_address',
        'viewing_time',
        'viewing_duration',
        'agent_phone',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },

  // Payment Templates
  payment_confirmation: {
    en: {
      id: 'payment_confirmation_en',
      key: 'payment_confirmation',
      category: 'payment',
      language: 'en',
      body: `💳 Payment Confirmed

Hello {{investor_name}},

Your subscription payment has been processed:

💰 Amount: {{amount}} {{currency}}
📅 Date: {{payment_date}}
📋 Plan: {{plan_name}}
🔢 Transaction ID: {{transaction_id}}

Invoice: {{invoice_link}}

Thank you for your subscription!
Access your premium features now: {{app_link}}`,
      variables: [
        'investor_name',
        'amount',
        'currency',
        'payment_date',
        'plan_name',
        'transaction_id',
        'invoice_link',
        'app_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    es: {
      id: 'payment_confirmation_es',
      key: 'payment_confirmation',
      category: 'payment',
      language: 'es',
      body: `💳 Pago Confirmado

Hola {{investor_name}},

Tu pago de suscripción ha sido procesado:

💰 Monto: {{amount}} {{currency}}
📅 Fecha: {{payment_date}}
📋 Plan: {{plan_name}}
🔢 ID de Transacción: {{transaction_id}}

Factura: {{invoice_link}}

¡Gracias por tu suscripción!
Accede a tus características premium ahora: {{app_link}}`,
      variables: [
        'investor_name',
        'amount',
        'currency',
        'payment_date',
        'plan_name',
        'transaction_id',
        'invoice_link',
        'app_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },

  // Payment Failed Templates
  payment_failed: {
    en: {
      id: 'payment_failed_en',
      key: 'payment_failed',
      category: 'payment',
      language: 'en',
      body: `⚠️ Payment Failed

Hello {{investor_name}},

We encountered an issue processing your payment:

💰 Amount: {{amount}} {{currency}}
📋 Plan: {{plan_name}}
❌ Reason: {{failure_reason}}

Please update your payment method:
{{payment_update_link}}

Need help?
📞 Support: {{support_phone}}
📧 support@puraestatecomposio.com`,
      variables: [
        'investor_name',
        'amount',
        'currency',
        'plan_name',
        'failure_reason',
        'payment_update_link',
        'support_phone',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    es: {
      id: 'payment_failed_es',
      key: 'payment_failed',
      category: 'payment',
      language: 'es',
      body: `⚠️ Pago Fallido

Hola {{investor_name}},

Encontramos un problema al procesar tu pago:

💰 Monto: {{amount}} {{currency}}
📋 Plan: {{plan_name}}
❌ Razón: {{failure_reason}}

Por favor actualiza tu método de pago:
{{payment_update_link}}

¿Necesitas ayuda?
📞 Soporte: {{support_phone}}
📧 support@puraestatecomposio.com`,
      variables: [
        'investor_name',
        'amount',
        'currency',
        'plan_name',
        'failure_reason',
        'payment_update_link',
        'support_phone',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },

  // Price Alert Templates
  price_alert: {
    en: {
      id: 'price_alert_en',
      key: 'price_alert',
      category: 'portfolio',
      language: 'en',
      body: `📉 Price Drop Alert!

Hello {{investor_name}},

A property in your watchlist just reduced its price:

📍 {{property_title}}
{{property_location}}

💰 Old Price: {{old_price}}
💰 New Price: {{new_price}}
💾 Savings: {{savings}} ({{discount_percent}}% off)

This is your chance! View the updated listing:
{{property_link}}

Interested? {{contact_agent_link}}`,
      variables: [
        'investor_name',
        'property_title',
        'property_location',
        'old_price',
        'new_price',
        'savings',
        'discount_percent',
        'property_link',
        'contact_agent_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    es: {
      id: 'price_alert_es',
      key: 'price_alert',
      category: 'portfolio',
      language: 'es',
      body: `📉 ¡Alerta de Reducción de Precio!

Hola {{investor_name}},

Una propiedad en tu lista de vigilancia acaba de reducir su precio:

📍 {{property_title}}
{{property_location}}

💰 Precio Anterior: {{old_price}}
💰 Nuevo Precio: {{new_price}}
💾 Ahorros: {{savings}} ({{discount_percent}}% de descuento)

¡Esta es tu oportunidad! Ver el listado actualizado:
{{property_link}}

¿Interesado? {{contact_agent_link}}`,
      variables: [
        'investor_name',
        'property_title',
        'property_location',
        'old_price',
        'new_price',
        'savings',
        'discount_percent',
        'property_link',
        'contact_agent_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },

  // Survey Templates
  survey_request: {
    en: {
      id: 'survey_request_en',
      key: 'survey_request',
      category: 'feedback',
      language: 'en',
      body: `📋 Quick Feedback Request

Hi {{investor_name}},

We'd love to hear about your viewing experience at:
📍 {{property_title}}

Your feedback helps us improve!
⭐ Rate your experience (1-5): {{survey_link}}

Takes just 2 minutes!

Thanks!`,
      variables: [
        'investor_name',
        'property_title',
        'survey_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    es: {
      id: 'survey_request_es',
      key: 'survey_request',
      category: 'feedback',
      language: 'es',
      body: `📋 Solicitud de Retroalimentación

Hola {{investor_name}},

Nos gustaría saber sobre tu experiencia de visualización en:
📍 {{property_title}}

¡Tu retroalimentación nos ayuda a mejorar!
⭐ Califica tu experiencia (1-5): {{survey_link}}

¡Solo toma 2 minutos!

¡Gracias!`,
      variables: [
        'investor_name',
        'property_title',
        'survey_link',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  },
};

export function getTemplate(
  key: string,
  language: 'es' | 'en' = 'en'
): MessageTemplate | undefined {
  return templates[key]?.[language];
}

export function interpolateTemplate(
  template: MessageTemplate,
  variables: Record<string, string>
): string {
  let message = template.body;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return message;
}

export default templates;
