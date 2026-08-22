export interface CreateOrderParams {
  invoiceId: string;
  amount: number; // in INR rupees
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentGatewayProvider {
  createOrder(params: CreateOrderParams): Promise<GatewayOrderResult>;
  verifyPaymentSignature(params: VerifySignatureParams): boolean;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}
