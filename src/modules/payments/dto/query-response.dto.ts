export interface VnPayQueryResponse {
  vnp_ResponseId: string;
  vnp_Command: string;
  vnp_ResponseCode: string;
  vnp_Message: string;
  vnp_TmnCode: string;
  vnp_TxnRef: string;
  vnp_Amount: string;
  vnp_OrderInfo: string;
  vnp_BankCode: string;
  vnp_PayDate: string;
  vnp_TransactionNo: string;
  vnp_TransactionType: string;
  vnp_TransactionStatus: string;
  vnp_SecureHash?: string;
}
