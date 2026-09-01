import { NextRequest, NextResponse } from 'next/server';
import { handleIncomingMessage } from '@/lib/whatsapp';
import { supabase } from '@/lib/supabase';

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

  console.log('Webhook verification request:', { mode, token, verifyToken });

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the token sent is correct
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully');
      // Respond with the challenge sent by Facebook
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.log('Webhook verification failed: invalid token');
      return new NextResponse('Forbidden', { status: 403 });
    }
  } else {
    console.log('Webhook verification failed: missing parameters');
    return new NextResponse('Missing parameters', { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('WhatsApp webhook event:', JSON.stringify(body, null, 2));

    // Handle status updates (delivery/read receipts)
    if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
      const statuses = body.entry[0].changes[0].value.statuses;

      for (const status of statuses) {
        const phoneNumber = status.recipient_id;
        const messageStatus = status.status; // delivered, read, failed
        const timestamp = status.timestamp;
        const messageId = status.id;

        console.log(`Message ${messageStatus}:`, phoneNumber);

        // Log the status update
        try {
          await supabase.from('logs_whatsapp').insert({
            tipo_evento: `message_${messageStatus}`,
            contenido: JSON.stringify(status),
          });
        } catch (error) {
          console.error('Error logging status:', error);
        }
      }
    }

    // Handle incoming messages
    if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
      const messages = body.entry[0].changes[0].value.messages;
      const contacts = body.entry[0].changes[0].value.contacts;

      for (const message of messages) {
        const fromPhoneNumber = message.from;
        const messageId = message.id;
        const timestamp = message.timestamp;

        console.log(`Incoming ${message.type} from ${fromPhoneNumber}`);

        // Process message based on type
        if (message.type === 'text') {
          await handleIncomingMessage(fromPhoneNumber, message.text.body, 'text');
        } else if (message.type === 'video') {
          await handleIncomingMessage(fromPhoneNumber, message.video.id, 'video');
        } else if (message.type === 'audio') {
          await handleIncomingMessage(fromPhoneNumber, message.audio.id, 'audio');
        } else if (message.type === 'image') {
          await handleIncomingMessage(fromPhoneNumber, message.image.id, 'image');
        }

        // Log the message
        try {
          await supabase.from('logs_whatsapp').insert({
            tipo_evento: 'message_received',
            contenido: JSON.stringify({
              from: fromPhoneNumber,
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
