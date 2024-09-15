const axios = require('axios');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    this.baseUrl = 'https://api.paystack.co';
  }

  async initializeTransaction(amount, email, metadata = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          amount: amount * 100, // Paystack expects amount in naira
          email,
          metadata
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Paystack initialize transaction error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to initialize transaction');
    }
  }

  async verifyTransaction(reference) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          }
        }
      );

      const transactionData = response.data.data;

      if (transactionData.status === 'success') {
        await this.saveTransaction(transactionData);
      }

      return transactionData;
    } catch (error) {
      console.error('Paystack verify transaction error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to verify transaction');
    }
  }

  async listTransactions(params = {}) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction`,
        {
          params,
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Paystack list transactions error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to list transactions');
    }
  }

  async fetchTransaction(id) {
    try {

      return response.data.data;
    } catch (error) {
      console.error('Paystack fetch transaction error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to fetch transaction');
    }
  }

  async chargeAuthorization(authorizationCode, amount, email, metadata = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/charge_authorization`,
        {
          authorization_code: authorizationCode,
          amount: amount * 100, // Paystack expects amount in kobo
          email,
          metadata
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const transactionData = response.data.data;

      if (transactionData.status === 'success') {
        await this.saveTransaction(transactionData);
      }

      return transactionData;
    } catch (error) {
      console.error('Paystack charge authorization error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to charge authorization');
    }
  }

  async createCustomer(email, firstName, lastName, phone) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/customer`,
        {
          email,
          first_name: firstName,
          last_name: lastName,
          phone
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Paystack create customer error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to create customer');
    }
  }

  async listCustomers(params = {}) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/customer`,
        {
          params,
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Paystack list customers error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to list customers');
    }
  }

  async fetchCustomer(customerId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/customer/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Paystack fetch customer error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to fetch customer');
    }
  }

  async updateCustomer(customerId, data) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/customer/${customerId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('Paystack update customer error:', error.response ? error.response.data : error.message);
      throw new Error('Failed to update customer');
    }
  }

  verifyWebhook(requestBody, paystackSignature) {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(JSON.stringify(requestBody))
      .digest('hex');

    return hash === paystackSignature;
  }

  async saveTransaction(transactionData) {
    const transaction = new Transaction({
      reference: transactionData.reference,
      amount: transactionData.amount / 100, // Convert back to main currency unit
      status: transactionData.status,
      customerId: transactionData.customer.id,
      customerEmail: transactionData.customer.email,
      paymentMethod: transactionData.channel,
      metadata: transactionData.metadata
    });

    await transaction.save();
  }

  getPublicKey() {
    return this.publicKey;
  }
}

module.exports = new PaystackService();
