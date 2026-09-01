import { supabase } from './supabase';

const WHATSAPP_API_URL = 'https://graph.instagram.com/v20.0';
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

export interface WhatsAppMessage {
  type: 'text' | 'template' | 'media';
  to: string;
  text?: string;
  template_name?: string;
  template_language?: string;
  parameters?: Record<string, any>;
}

export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  if (!phoneNumberId || !accessToken) {
    console.error('WhatsApp credentials not configured');
    return false;
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phoneNumber.replace(/[^\d+]/g, ''), // Limpiar formato
          type: 'text',
          text: {
            body: message,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      return false;
    }

    const data = await response.json();
    console.log('WhatsApp message sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

export async function sendEvaluationStart(
  candidatoId: string,
  phoneNumber: string,
  candidateName: string
): Promise<void> {
  const message = `¡Hola ${candidateName}! 👋

Gracias por postularte a nuestra vacante. Nos alegra mucho tu interés en unirse a nuestro equipo.

Para continuar con el proceso de selección, necesitamos que respondas algunas preguntas en video. Es simple y rápido.

¿Estás listo para comenzar? Responde con "Sí" para proceder.`;

  const sent = await sendWhatsAppMessage(phoneNumber, message);

  if (sent) {
    // Create evaluation record
    await supabase.from('evaluaciones_whatsapp').insert({
      candidato_id: candidatoId,
      paso: 1,
      estado: 'en_proceso',
      mensaje_confirmacion_enviado: true,
    });
  }
}

export async function sendVideoPrompt(
  evaluacionId: string,
  phoneNumber: string,
  questionNumber: number,
  question: string
): Promise<void> {
  const message = `📹 Pregunta ${questionNumber}:

${question}

Por favor, responde con un video corto (máximo 1 minuto). Sé natural y directo.

Puedes enviar el video cuando estés listo.`;

  await sendWhatsAppMessage(phoneNumber, message);

  // Log the event
  await supabase.from('logs_whatsapp').insert({
    evaluacion_id: evaluacionId,
    tipo_evento: 'video_prompt_sent',
    contenido: JSON.stringify({ questionNumber, question }),
  });
}

export async function sendTestQuestion(
  evaluacionId: string,
  phoneNumber: string,
  questionNumber: number,
  question: string,
  options?: string[]
): Promise<void> {
  let message = `🧪 Pregunta ${questionNumber}:

${question}`;

  if (options && options.length > 0) {
    message += '\n\nOpciones:\n';
    options.forEach((opt, idx) => {
      message += `${idx + 1}. ${opt}\n`;
    });
    message += '\nResponde con el número de tu opción (ej: 1, 2, 3...)';
  }

  await sendWhatsAppMessage(phoneNumber, message);

  // Log
  await supabase.from('logs_whatsapp').insert({
    evaluacion_id: evaluacionId,
    tipo_evento: 'test_question_sent',
    contenido: JSON.stringify({ questionNumber, question, options }),
  });
}

export async function sendEvaluationComplete(
  phoneNumber: string,
  candidateName: string,
  scoreTotal: number
): Promise<void> {
  const message = `✅ ¡Listo, ${candidateName}!

Hemos recibido todas tus respuestas. Tu evaluación está completa.

Tu puntuación: ${Math.round(scoreTotal)}/100

Pronto nos pondremos en contacto contigo con los resultados. ¡Gracias por tu tiempo!`;

  await sendWhatsAppMessage(phoneNumber, message);
}

export async function handleIncomingMessage(
  phoneNumber: string,
  messageText: string,
  messageType: string
): Promise<void> {
  try {
    // Find candidate by phone
    const { data: candidato } = await supabase
      .from('candidatos')
      .select('id, vacante_id, nombre')
      .eq('telefono', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!candidato) {
      console.log('Candidate not found for phone:', phoneNumber);
      return;
    }

    // Get or create evaluation
    let { data: evaluacion } = await supabase
      .from('evaluaciones_whatsapp')
      .select('*')
      .eq('candidato_id', candidato.id)
      .eq('vacante_id', candidato.vacante_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!evaluacion) {
      const { data: newEval } = await supabase
        .from('evaluaciones_whatsapp')
        .insert({
          candidato_id: candidato.id,
          vacante_id: candidato.vacante_id,
          paso: 1,
          estado: 'en_proceso',
        })
        .select()
        .single();
      evaluacion = newEval;
    }

    // Process based on step
    if (evaluacion?.paso === 1) {
      // Step 1: Confirmation
      if (messageText.toLowerCase().includes('sí') || messageText.toLowerCase().includes('si')) {
        // Move to step 2
        await supabase
          .from('evaluaciones_whatsapp')
          .update({
            paso: 2,
            respuesta_confirmacion: messageText,
          })
          .eq('id', evaluacion.id);

        // Send first video prompt
        await sendVideoPrompt(
          evaluacion.id,
          phoneNumber,
          1,
          '¿Por qué te interesa esta posición y qué valores aportas al equipo?'
        );
      } else {
        // Negative response
        await sendWhatsAppMessage(
          phoneNumber,
          'Entendemos, gracias por tu interés. ¡Buena suerte en tu búsqueda!'
        );

        await supabase
          .from('evaluaciones_whatsapp')
          .update({ estado: 'abandonado' })
          .eq('id', evaluacion.id);
      }
    } else if (evaluacion?.paso === 2 && messageType === 'video') {
      // Step 2: Video received
      const videos = evaluacion?.videos || [];
      videos.push({
        media_id: messageText, // In real scenario, extract from webhook
        received_at: new Date().toISOString(),
      });

      await supabase
        .from('evaluaciones_whatsapp')
        .update({ videos })
        .eq('id', evaluacion.id);

      // Check if all videos collected (assume 2 videos)
      if (videos.length >= 2) {
        // Move to step 3
        await supabase
          .from('evaluaciones_whatsapp')
          .update({ paso: 3 })
          .eq('id', evaluacion.id);

        await sendTestQuestion(
          evaluacion.id,
          phoneNumber,
          1,
          '¿Cuál es tu principal fortaleza técnica?',
          ['React/Frontend', 'Backend/Arquitectura', 'DevOps/Infraestructura', 'Full-Stack']
        );
      } else {
        // Request more videos
        const remaining = 2 - videos.length;
        await sendVideoPrompt(
          evaluacion.id,
          phoneNumber,
          videos.length + 1,
          `Pregunta ${videos.length + 1}: ¿Cuál ha sido tu mayor desafío técnico y cómo lo resolviste?`
        );
      }
    } else if (evaluacion?.paso === 3) {
      // Step 3: Test answers
      const responses = evaluacion?.respuestas_test || [];
      responses.push({
        pregunta_id: responses.length + 1,
        respuesta: messageText,
        timestamp: new Date().toISOString(),
      });

      await supabase
        .from('evaluaciones_whatsapp')
        .update({ respuestas_test: responses })
        .eq('id', evaluacion.id);

      // Check if evaluation complete
      if (responses.length >= 3) {
        // Mark as complete
        await supabase
          .from('evaluaciones_whatsapp')
          .update({ estado: 'completado' })
          .eq('id', evaluacion.id);

        // Calculate scores (simplified)
        const scoreTest = 75 + Math.random() * 25;

        // Update candidate
        await supabase
          .from('candidatos')
          .update({
            score_test: Math.round(scoreTest),
            score_video: 85,
            score_total: Math.round((scoreTest + 85) / 2),
            estado: 'en_revision',
          })
          .eq('id', candidato.id);

        await sendEvaluationComplete(phoneNumber, candidato.nombre, scoreTest);
      } else {
        // Send next question
        await sendTestQuestion(
          evaluacion.id,
          phoneNumber,
          responses.length + 1,
          'Pregunta ' + (responses.length + 1) + ': ¿Cuál es tu experiencia con metodologías ágiles?',
          ['Scrum/Sprint', 'Kanban', 'Ambas', 'Poca experiencia']
        );
      }
    }
  } catch (error) {
    console.error('Error handling WhatsApp message:', error);
  }
}
