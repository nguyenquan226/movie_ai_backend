import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUser } from '../users/interface/user.interface';
import { VnPayData } from '../payments/types/vnpayData';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendVerifyUpgradeVipEmail(to: string) {
    return this.mailerService.sendMail({
      from: `${this.configService.get<string>('COMPANY_NAME') || 'Chill Flix'} <${this.configService.get<string>('EMAIL_AUTH_USER')}>`,
      to,
      subject: 'Xác thực nâng cấp VIP',
      template: 'test',
      context: {},
    });
  }
  async sendMailAfterRegister(userName: string, email: string) {
    return this.mailerService.sendMail({
      from: `${this.configService.get<string>('COMPANY_NAME') || 'Chill Flix'} <${this.configService.get<string>('EMAIL_AUTH_USER')}>`,
      to: email,
      subject: 'Chào mừng bạn đến với ChillFlix!',
      template: 'registersucess',
      context: {
        name: userName,
        email: email,
      },
    });
  }

  async sendBillUpgradeVipEmail(
    email: string,
    fullName: string,
    vnpData: VnPayData,
    planName: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      const emailData = {
        userName: fullName || 'Quý khách',
        userEmail: email,

        planName,
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        vnp_TxnRef: vnpData.vnp_TxnRef,
        vnp_TransactionNo: vnpData.vnp_TransactionNo,
        vnp_PayDate: this.formatDate(vnpData.vnp_PayDate),
        vnp_CardType: vnpData.vnp_CardType || 'ATM',
        vnp_BankCode: vnpData.vnp_BankCode || 'N/A',
        vnp_Amount: vnpData.vnp_Amount,
        vnp_OrderInfo: vnpData.vnp_OrderInfo,

        formattedAmount: this.formatAmount(vnpData.vnp_Amount),
        websiteUrl: this.configService.get<string>('FRONTEND_URL'),
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL'),
        supportPhone: this.configService.get<string>('SUPPORT_PHONE'),
        companyName: this.configService.get<string>('COMPANY_NAME') || 'Chill Flix',
        companyAddress: this.configService.get<string>('COMPANY_ADDRESS'),
      };
      return this.mailerService.sendMail({
        from: `${emailData.companyName} <${this.configService.get<string>('EMAIL_AUTH_USER')}>`,
        to: email,
        subject: 'Hóa đơn nâng cấp VIP trên ChillFLix',
        template: 'upgrade-vip-bill',
        context: emailData,
      });
    } catch (error) {
      console.error('Error sending bill upgrade VIP email:', error);
    }
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
  }

  private formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(dateObj);
  }
}
