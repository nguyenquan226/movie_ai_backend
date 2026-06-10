export interface RefundRequestDto {
  orderId: string;
  transDate: string;
  amount: number;
  transType: string;
  user: string;
}

export class VnPayRefundResponseDto {
  vnp_ResponseId: string;
  vnp_Command: 'refund';
  vnp_ResponseCode: string; // "00" thành công, các mã khác là lỗi
  vnp_Message: string;
  vnp_TmnCode: string;
  vnp_TxnRef: string;
  vnp_Amount: string; // số tiền refund (đơn vị = đồng * 100)
  vnp_OrderInfo: string;
  vnp_BankCode: string;
  vnp_PayDate: string;
  vnp_TransactionNo: string;
  vnp_TransactionType: string; // "02" = refund
  vnp_TransactionStatus: string; // trạng thái refund: 05,06,09,...
  vnp_SecureHash?: string;
}
