export interface IPaymentUser {
  userId: number;
  email: string;
  avatarUrl: string;
  fullName: string;
}

export interface IPaymentPlan {
  planName: string;
  planDuration: number;
  durationTypeCode: string;
}

export interface IPayment {
  paymentId: string; // UUID
  userId: number;
  planId: number;
  amount: string;
  status: string;
  paymentMethod: string;

  vnpayTxnRef: string;
  vnpayResponseCode: string;
  vnpayBankCode: string;
  vnpayTransactionNo: string;
  vnpayOrderInfo: string;
  vnpayPayDate: string;

  description: string;
  createdAt: string;

  user: IPaymentUser;
  plan: IPaymentPlan;
}

export interface IPaymentReturn {
  payments: IPayment[];
}
