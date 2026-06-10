import { Injectable, InternalServerErrorException, Req, Res } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import moment from 'moment';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { sortObject } from 'src/utils/vnpay.util';
let crypto = require('crypto');
let querystring = require('qs');
import axios from 'axios';
import { VNPAY_TRANSACTION_STATUS_MESSAGE } from 'src/constants/vnpay.constant';
import type { RefundRequestDto, VnPayRefundResponseDto } from './dto/refund-vnpay.dto';
import { VnPayQueryResponse } from './dto/query-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import type { IUser } from '../users/interface/user.interface';
import { SubscriptionStatus } from '../subscriptions/types/subscriptionStatus';
import { PaymentMethod, PaymentStatus } from './types/enum';
import { EmailService } from '../email/email.service';
import _ from 'lodash';

@Injectable()
export class PaymentsService {
  constructor(
    private configService: ConfigService,
    private emailService: EmailService,

    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,

    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async createPaymentUrl(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    user: IUser,
    inputPlanId: number,
  ) {
    try {
      const plan = await this.planRepository.findOne({
        where: { planId: inputPlanId, isActive: true },
      });

      console.log('check plan exxist', plan);

      if (!plan) {
        return {
          EC: 0,
          EM: 'VIP package does not exist or has been disabled',
        };
      }

      const activeSubsciption = await this.subscriptionRepository.findOne({
        where: { status: SubscriptionStatus.ACTIVE, userId: user.userId },
      });

      console.log('check activeSubsciption', activeSubsciption);

      if (activeSubsciption) {
        return {
          EC: 0,
          EM: 'You have an active VIP Plan',
        };
      }

      // Create pending payment record

      const newPendingPayment = this.paymentRepository.create({
        userId: user.userId,
        planId: plan.planId,
        amount: Number(plan.price),
        status: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.VNPAY,
        description: `Thanh toán cho: ${plan.planName}`,
      });

      await this.paymentRepository.save(newPendingPayment);

      //ip khachs hàng
      let ipAddr =
        req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        '127.0.0.1';

      if (Array.isArray(ipAddr)) {
        ipAddr = ipAddr[0];
      }

      if (typeof ipAddr === 'string') {
        ipAddr = ipAddr.replace('::ffff:', '');
        if (ipAddr === '::1') ipAddr = '127.0.0.1';
      }

      let currentDate = new Date();
      let createDate = moment(currentDate).format('YYYYMMDDHHmmss');
      let tmnCode = this.configService.get<string>('VNP_TMN_CODE');
      let secretKey = this.configService.get<string>('VNP_HASH_SECRET');
      let returnUrl = this.configService.get<string>('VNP_RETURN_URL');

      let orderId = newPendingPayment.paymentId;
      let amount = newPendingPayment.amount;
      let locale = 'vn';
      let currCode = 'VND';
      let orederInfor = `Thanh toán cho: ${plan.planName} - Ma GD: ${orderId}`;
      let orderType = 190003;

      let vnp_Params: any = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: locale,
        vnp_CurrCode: currCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orederInfor,
        vnp_OrderType: orderType,
        vnp_Amount: amount * 100, // VNPay yêu cầu đơn vị = đồng × 100
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
      };

      // if (bankCode !== null && bankCode !== '') {
      //   vnp_Params['vnp_BankCode'] = bankCode;
      // }
      // vnp_Params['vnp_BankCode'] = 'NCB';

      vnp_Params = sortObject(vnp_Params);
      let signData = querystring.stringify(vnp_Params, { encode: false }); //convert vnp_Params to qwuery string
      let hmac = crypto.createHmac('sha512', secretKey);

      let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
      vnp_Params['vnp_SecureHash'] = signed;

      let vnpUrl = this.configService.get<string>('VNP_URL');
      vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

      newPendingPayment.vnpayTxnRef = orderId;
      newPendingPayment.vnpayOrderInfo = orederInfor;
      await this.paymentRepository.save(newPendingPayment);

      return {
        EC: 1,
        EM: 'Create VNPAY payment URL success',
        metadata: {
          paymentId: newPendingPayment.paymentId,
          redirectUrl: vnpUrl,
          amount: newPendingPayment.amount,
          planName: plan.planName,
        },
      };
    } catch (error) {
      console.error('Error in Create VNPAY payment URL:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from create payment url service',
      });
    }
  }

  async verifyReturn(@Req() req: Request, @Res() res: Response) {
    try {
      let vnp_Params = req.query;
      let secureHash = vnp_Params['vnp_SecureHash'];

      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      vnp_Params = sortObject(vnp_Params);

      let tmnCode = this.configService.get<string>('VNP_TMN_CODE');
      let secretKey = this.configService.get<string>('VNP_HASH_SECRET');
      const orderId = String(vnp_Params['vnp_TxnRef']);

      let signData = querystring.stringify(vnp_Params, { encode: false });

      let hmac = crypto.createHmac('sha512', secretKey);
      let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');

      const frontendURL = this.configService.get<string>('FRONTEND_URL');
      if (secureHash !== signed) {
        // return res.redirect(`${frontendURL}/payment/failed?reason=invalid_signature`);
        return res.status(200).json({
          message: 'Checksum failed',
          code: '97',
        });
      } else {
        console.log('chekc', vnp_Params);
        const vnpayTxnRef = vnp_Params['vnp_TxnRef'] as string;
        const vnpayResponseCode = vnp_Params['vnp_ResponseCode'] as string;
        const vnpayTransactionNo = vnp_Params['vnp_TransactionNo'] as string;
        const vnpayBankCode = vnp_Params['vnp_BankCode'] as string;
        const vnpayPayDate = vnp_Params['vnp_PayDate'] as string;

        // Find payment by transaction reference (paymentId)
        const payment = await this.paymentRepository.findOne({
          where: { paymentId: vnpayTxnRef },
        });

        if (!payment) {
          return {
            EC: 0,
            EM: 'Payment not found',
          };
        }

        payment.vnpayResponseCode = vnpayResponseCode;
        payment.vnpayTransactionNo = vnpayTransactionNo;
        payment.vnpayBankCode = vnpayBankCode;
        payment.vnpayPayDate = moment(vnpayPayDate, 'YYYYMMDDHHmmss').toDate();
        console.log('Check responseCode:', vnpayResponseCode);

        if (vnpayResponseCode === '00') {
          payment.status = PaymentStatus.SUCCESS;
          await this.paymentRepository.save(payment);

          // Activate VIP subscription
          await this.activateVipSubscription(payment);
        } else {
          payment.status = PaymentStatus.FAILED;
          await this.paymentRepository.save(payment);
        }
        //redirect after payment
        res.redirect(
          `${frontendURL}/user/upgrade_vip?orderId=${orderId}&responseCode=${vnp_Params['vnp_ResponseCode']}`,
        );
      }
    } catch (error) {
      console.error('Error in verifyReturn VNPAY:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from verifyReturn service',
      });
    }
  }

  async handleQueryTransaction(@Req() req: Request, transDate: string) {
    try {
      let vnp_TmnCode = this.configService.get<string>('VNP_TMN_CODE');
      let secretKey = this.configService.get<string>('VNP_HASH_SECRET');
      let vnp_Api = this.configService.get<string>('VNP_API');

      let currentDate = new Date();
      let vnp_TxnRef = req.body.orderId;
      let vnp_TransactionDate = transDate;
      let vnp_RequestId = moment(currentDate).format('HHmmss');
      let vnp_Version = '2.1.0';
      let vnp_Command = 'querydr';
      let vnp_OrderInfo = 'Truy van GD ma:' + vnp_TxnRef;
      let vnp_IpAddr =
        req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        '127.0.0.1';
      let currCode = 'VND';
      let vnp_CreateDate = moment(currentDate).format('YYYYMMDDHHmmss');

      const data = [
        vnp_RequestId,
        vnp_Version,
        vnp_Command,
        vnp_TmnCode,
        vnp_TxnRef,
        vnp_TransactionDate,
        vnp_CreateDate,
        vnp_IpAddr,
        vnp_OrderInfo,
      ].join('|');

      let hmac = crypto.createHmac('sha512', secretKey);
      let vnp_SecureHash = hmac.update(new Buffer(data, 'utf-8')).digest('hex');

      let dataObj = {
        vnp_RequestId: vnp_RequestId,
        vnp_Version: vnp_Version,
        vnp_Command: vnp_Command,
        vnp_TmnCode: vnp_TmnCode,
        vnp_TxnRef: vnp_TxnRef,
        vnp_OrderInfo: vnp_OrderInfo,
        vnp_TransactionDate: vnp_TransactionDate,
        vnp_CreateDate: vnp_CreateDate,
        vnp_IpAddr: vnp_IpAddr,
        vnp_SecureHash: vnp_SecureHash,
      };
      // /merchant_webapi/api/transaction
      const response = await axios.post(vnp_Api as string, dataObj);
      const resData: VnPayQueryResponse = response.data;
      delete resData['vnp_SecureHash'];
      const statusMessage =
        VNPAY_TRANSACTION_STATUS_MESSAGE[resData.vnp_TransactionStatus] ||
        'Trạng thái không xác định';

      return {
        EC: resData.vnp_ResponseCode === '00' ? 1 : 0,
        EM: statusMessage,
        ...resData,
      };
    } catch (error) {
      console.error('Error in handleQueryTransaction VNPAY:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from handleQueryTransaction service',
      });
    }
  }

  async handleRefund(@Req() req: Request, body: RefundRequestDto) {
    try {
      const date = new Date();
      const vnp_TmnCode = this.configService.get<string>('VNP_TMN_CODE');
      const secretKey = this.configService.get<string>('VNP_HASH_SECRET');
      let vnp_Api = this.configService.get<string>('VNP_API');

      const vnp_TxnRef = body.orderId;
      const vnp_TransactionDate = body.transDate;
      const vnp_Amount = body.amount * 100; // VNPay tính đơn vị *100
      const vnp_TransactionType = body.transType || '02';
      const vnp_CreateBy = body.user || 'admin';

      const vnp_RequestId = moment(date).format('HHmmss');
      const vnp_Version = '2.1.0';
      const vnp_Command = 'refund';
      const vnp_OrderInfo = `Hoan tien GD ma: ${vnp_TxnRef}`;
      const vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');
      const vnp_IpAddr =
        req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        '127.0.0.1';
      const vnp_TransactionNo = '0'; // yêu cầu VNPay

      // Tạo secure hash
      const dataString = [
        vnp_RequestId,
        vnp_Version,
        vnp_Command,
        vnp_TmnCode,
        vnp_TransactionType,
        vnp_TxnRef,
        vnp_Amount,
        vnp_TransactionNo,
        vnp_TransactionDate,
        vnp_CreateBy,
        vnp_CreateDate,
        vnp_IpAddr,
        vnp_OrderInfo,
      ].join('|');

      const vnp_SecureHash = crypto
        .createHmac('sha512', secretKey)
        .update(Buffer.from(dataString, 'utf-8'))
        .digest('hex');

      const dataObj = {
        vnp_RequestId,
        vnp_Version,
        vnp_Command,
        vnp_TmnCode,
        vnp_TransactionType,
        vnp_TxnRef,
        vnp_Amount,
        vnp_TransactionNo,
        vnp_CreateBy,
        vnp_OrderInfo,
        vnp_TransactionDate,
        vnp_CreateDate,
        vnp_IpAddr,
        vnp_SecureHash,
      };

      const response = await axios.post(vnp_Api as string, dataObj);
      const resData: VnPayRefundResponseDto = response.data;
      delete resData['vnp_SecureHash'];
      // Trả về thông tin status cho frontend
      return {
        EC: resData.vnp_ResponseCode === '00' ? 1 : 0,
        EM: resData.vnp_Message,
        ...resData,
      };
    } catch (error) {
      console.error('Error in handleRefund:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from refund service',
      });
    }
  }

  async activateVipSubscription(payment: Payment) {
    try {
      const plan = await this.planRepository.findOne({
        where: { planId: payment.planId },
      });

      if (!plan) {
        return {
          EC: 0,
          EM: 'VIP Plan not found',
        };
      }

      const startDate = new Date();
      const endDate = new Date();

      switch (plan.durationTypeCode) {
        case 'MONTH':
          endDate.setMonth(endDate.getMonth() + plan.planDuration);
          break;
        case 'YEAR':
          endDate.setFullYear(endDate.getFullYear() + plan.planDuration);
          break;
        case 'DAY':
          endDate.setDate(endDate.getDate() + plan.planDuration);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + plan.planDuration);
      }

      const newSubscription = this.subscriptionRepository.create({
        userId: payment.userId,
        planId: payment.planId,
        paymentId: payment.paymentId,
        startDate,
        endDate,
        status: SubscriptionStatus.ACTIVE,
        autoRenew: false,
        createdBy: payment.userId,
      });

      await this.subscriptionRepository.save(newSubscription);

      // Update user VIP status
      const user = await this.userRepository.findOne({ where: { userId: payment.userId } });
      const resultUpdate = await this.userRepository.update(
        { userId: payment.userId },
        {
          isVip: true,
          vipExpireDate: endDate,
        },
      );

      console.log('check update', resultUpdate);
      console.log(`VIP subscription activated for user ${payment.userId}`);

      if (user) {
        const vnpData = {
          vnp_Amount: payment.amount,
          vnp_BankCode: payment.vnpayBankCode,
          vnp_BankTranNo: payment.vnpayBankCode,
          vnp_CardType: 'ATM',
          vnp_OrderInfo: payment.vnpayOrderInfo,
          vnp_PayDate: payment.vnpayPayDate?.toLocaleString('vi-VN'),
          vnp_ResponseCode: payment.vnpayResponseCode,
          vnp_TransactionNo: payment.vnpayTransactionNo,
          vnp_TransactionStatus: payment.status,
          vnp_TxnRef: payment.vnpayTxnRef,
        };
        // await this.emailService.sendBillUpgradeVipEmail(user, vnpData, plan.planName);
        await this.emailService.sendBillUpgradeVipEmail(
          user.email,
          user.fullName,
          vnpData,
          plan.planName,
          startDate,
          endDate,
        );
      }
    } catch (error) {
      console.error('Error in active Vip Subscription for user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from active Vip Subscription for user',
      });
    }
  }

  async findAll() {
    try {
      const payments = await this.paymentRepository.find({
        relations: ['user', 'subscription.plan'],
      });

      const clean = (obj) => _.omit(obj, ['user', 'updatedAt', 'subscription']);

      const mapped = payments.map((pay) => {
        const subscription = pay.subscription;
        const plan = subscription?.plan;
        return {
          ...clean(pay),
          user: pay.user
            ? {
                userId: pay.user.userId,
                email: pay.user.email,
                avatarUrl: pay.user.avatarUrl,
                fullName: pay.user.fullName,
              }
            : null,
          plan: plan
            ? {
                planName: plan.planName,
                planDuration: plan.planDuration,
                durationTypeCode: plan.durationTypeCode,
              }
            : null,
        };
      });
      return {
        EC: 1,
        EM: 'Get all payments success',
        payments: mapped,
      };
    } catch (error) {
      console.error('Error in get All payment:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from get All payment service',
      });
    }
  }
}
