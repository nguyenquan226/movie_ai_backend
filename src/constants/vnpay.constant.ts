export const VNPAY_TRANSACTION_STATUS = {
  SUCCESS: '00', // Giao dịch thành công
  PENDING: '01', // Giao dịch chưa hoàn tất
  FAILED: '02', // Giao dịch bị lỗi
  REVERSED: '04', // Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY)
  REFUND_PROCESSING: '05', // VNPAY đang xử lý giao dịch này (GD hoàn tiền)
  REFUND_SENT: '06', // VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng (GD hoàn tiền)
  SUSPECTED_FRAUD: '07', // Giao dịch bị nghi ngờ gian lận
  REFUND_REJECTED: '09', // GD Hoàn trả bị từ chối
} as const;

export const VNPAY_TRANSACTION_STATUS_MESSAGE: Record<string, string> = {
  '00': 'Giao dịch thành công',
  '01': 'Giao dịch chưa hoàn tất',
  '02': 'Giao dịch bị lỗi',
  '04': 'Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY)',
  '05': 'VNPAY đang xử lý giao dịch này (GD hoàn tiền)',
  '06': 'VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng (GD hoàn tiền)',
  '07': 'Giao dịch bị nghi ngờ gian lận',
  '09': 'GD Hoàn trả bị từ chối',
};
