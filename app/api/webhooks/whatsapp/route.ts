import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { handleIncomingMessage } from '@/lib/whatsapp';
import { supabase } from '@/lib/supabase';

type WebhookBody = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: Array<{ status: string; id: string }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: 'text' | 'video' | 'audio' | 'image';
          text?: { body: string };
          video?: { id: string };
          audio?: { id: string };
          image?: { id: string };
        }>;
      };
    }>;
  }>;
};

/**
 * Webhook handler for WhatsApp Cloud API
 * Handles:
 * 1. Verification requests (GET)
 * 2. Incoming messages and status updates (POST)
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  console.log('[Webhook] Verification requested', { mode });

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the token sent is correct
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully');
      // Respond with the challenge sent by Facebook
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.log('[Webhook] Verification failed: invalid credential');
      return new NextResponse('Forbidden', { status: 403 });
    }
  } else {
    console.log('Webhook verification failed: missing parameters');
    return new NextResponse('Missing parameters', { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    if (!appSecret) {
      console.error('[Webhook] Signing secret is not configured');
      return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 });
    }

    const rawBody = await request.text();
    const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    const receivedBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let body: WebhookBody;
    try {
      body = JSON.parse(rawBody) as WebhookBody;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('[Webhook] Signed event received');

    // Handle status updates (delivery/read receipts)
    if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
      const statuses = body.entry[0].changes[0].value.statuses;

      for (const status of statuses) {
        const messageStatus = status.status; // delivered, read, failed

        console.log('[Webhook] Delivery status received', { messageStatus });

        // Log the status update
        try {
          await supabase.from('logs_whatsapp').insert({
            tipo_evento: `message_${messageStatus}`,
            contenido: JSON.stringify({ status: messageStatus, messageId: status.id }),
          });
        } catch (error) {
          console.error('Error logging status:', error);
        }
      }
    }

    // Handle incoming messages
    if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
      const messages = body.entry[0].changes[0].value.messages;
      for (const message of messages) {
        const fromPhoneNumber = message.from;
        const messageId = message.id;
        const timestamp = message.timestamp;

        console.log('[Webhook] Incoming message received', { type: message.type, messageId });

        // Process message based on type
        if (message.type === 'text') {
          await handleIncomingMessage(fromPhoneNumber, message.text?.body || '', 'text');
        } else if (message.type === 'video') {
          await handleIncomingMessage(fromPhoneNumber, message.video?.id || '', 'video');
        } else if (message.type === 'audio') {
          await handleIncomingMessage(fromPhoneNumber, message.audio?.id || '', 'audio');
        } else if (message.type === 'image') {
          await handleIncomingMessage(fromPhoneNumber, message.image?.id || '', 'image');
        }

        // Log the message
        try {
          await supabase.from('logs_whatsapp').insert({
            tipo_evento: 'message_received',
            contenido: JSON.stringify({
              type: message.type,
              timestamp,
              messageId,
            }),
          });
        } catch (error) {
          console.error('Error logging message:', error);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
