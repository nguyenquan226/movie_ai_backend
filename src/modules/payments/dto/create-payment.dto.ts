import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber({}, { message: 'amout mus be a number' })
  @Min(1)
  amount: number; // số tiền thanh toán, VNPay yêu cầu nhân 100 trong backend

  @IsNotEmpty()
  @IsString()
  orderId: string;
}
