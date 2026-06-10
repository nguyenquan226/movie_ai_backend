export interface VnPayData {
  vnp_Amount: number;
  vnp_BankCode: string;
  vnp_BankTranNo?: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate?: Date | string;
  vnp_ResponseCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
}
