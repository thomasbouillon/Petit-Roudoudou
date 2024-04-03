'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export default function LiveChat() {
  useEffect(() => {
    const w = window as any;
    if (typeof window === 'undefined' || typeof w.BrevoConversations !== 'undefined') return;
    w.BrevoConversationsID = '65832f53e8165b04ab20878c';
    console.log('LiveChat setup');
    w.BrevoConversations =
      w.BrevoConversations ||
      function () {
        (w.BrevoConversations.q = w.BrevoConversations.q || []).push(arguments);
      };
  }, []);

  return <Script src="https://conversations-widget.brevo.com/brevo-conversations.js" strategy="lazyOnload" />;
}
