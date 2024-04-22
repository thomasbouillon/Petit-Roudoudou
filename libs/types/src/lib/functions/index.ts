// Contact

export type CallSendContactEmailPayload = {
  email: string;
  subject: string;
  message: string;
  recaptchaToken: string;
};

export type CallSendContactEmailResponse = void;

export type CallSubscribeToNewsletterPayload = {
  name: string;
  email: string;
  category: string;
  privacy: true;
};

export type CallSubscribeToNewsletterResponse = void;
