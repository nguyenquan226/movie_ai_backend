import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { IPayment } from './types/payment';

@Injectable()
export class PaymentReportService {
  async generatePaymentReport(payments: IPayment[]) {
    const html = this.renderTemplate(payments);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '15px',
        right: '15px',
      },
    });

    await browser.close();
    return pdf;
  }

  private renderTemplate(payments: IPayment[]) {
    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 13px;
              margin: 0;
              padding: 0;
            }

            h1 {
              text-align: center;
              margin-bottom: 20px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }

            th, td {
              border: 1px solid #ccc;
              padding: 6px 8px;
              text-align: left;
            }

            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }

            .status-success {
              color: green;
              font-weight: bold;
            }

            .status-failed {
              color: red;
              font-weight: bold;
            }

          </style>
        </head>
        <body>
          <h1>BÁO CÁO THANH TOÁN</h1>

          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Người dùng</th>
                <th>Gói VIP</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Phương thức</th>
                <th>Ngân hàng</th>
                <th>Thời gian tạo</th>
              </tr>
            </thead>

            <tbody>
              ${payments
                .map(
                  (p) => `
                <tr>
                  <td>${p.paymentId}</td>
                  <td>${p.user.fullName}<br/>${p.user.email}</td>
                  <td>${p.plan.planName}</td>
                  <td>${Number(p.amount).toLocaleString('vi-VN')} ₫</td>
                  <td class="${p.status === 'SUCCESS' ? 'status-success' : 'status-failed'}">${p.status}</td>
                  <td>${p.paymentMethod}</td>
                  <td>${p.vnpayBankCode || '-'}</td>
                  <td>${p.createdAt}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }
}
