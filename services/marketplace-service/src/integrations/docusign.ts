import axios from 'axios';
import fs from 'fs';
import path from 'path';
import config from '../config';
import logger from '../utils/logger';
import { AppError } from '../middleware/error-handler';

interface ContractSignatureRequest {
  contractId: string;
  contractNumber: string;
  brandId: string;
  creatorId: string;
  contractData: {
    terms: any;
    paymentTerms: any;
    totalAmount: string;
    currency: string;
    deliverables: any[];
    startDate: Date;
    endDate: Date;
  };
}

interface Signer {
  email: string;
  name: string;
  recipientId: string;
  routingOrder: string;
}

class DocuSignIntegration {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Get OAuth access token using JWT
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Check if token is still valid
      if (this.accessToken && Date.now() < this.tokenExpiresAt) {
        return this.accessToken!;
      }

      // Read private key
      const privateKey = fs.readFileSync(
        path.resolve(config.docusign.privateKeyPath),
        'utf8'
      );

      const response = await axios.post(
        `${config.docusign.oauthBasePath}/oauth/token`,
        new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: this.generateJWT(privateKey),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);

      logger.info('DocuSign access token obtained');
      return this.accessToken!;
    } catch (error) {
      logger.error('Error getting DocuSign access token:', error);
      throw new AppError(500, 'Failed to authenticate with DocuSign');
    }
  }

  /**
   * Generate JWT for authentication
   */
  private generateJWT(privateKey: string): string {
    // This is a simplified version. In production, use a proper JWT library
    // with RS256 signing using the private key
    const jwt = require('jsonwebtoken');

    const payload = {
      iss: config.docusign.integrationKey,
      sub: config.docusign.userId,
      aud: config.docusign.oauthBasePath,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      scope: 'signature impersonation',
    };

    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  }

  /**
   * Send contract for signature
   */
  async sendContractForSignature(request: ContractSignatureRequest): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();

      // Get signer information (would normally fetch from database)
      const signers = await this.getSignersInfo(request.brandId, request.creatorId);

      // Create envelope
      const envelopeDefinition = this.createEnvelopeDefinition(request, signers);

      const response = await axios.post(
        `${config.docusign.apiBasePath}/v2.1/accounts/${config.docusign.accountId}/envelopes`,
        envelopeDefinition,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const envelopeId = response.data.envelopeId;
      logger.info(`DocuSign envelope created: ${envelopeId} for contract ${request.contractId}`);

      return envelopeId;
    } catch (error: any) {
      logger.error('Error sending contract for signature:', error.response?.data || error);
      throw new AppError(500, 'Failed to send contract for signature');
    }
  }

  /**
   * Create envelope definition
   */
  private createEnvelopeDefinition(
    request: ContractSignatureRequest,
    signers: Signer[]
  ): any {
    const contractDocument = this.generateContractDocument(request);

    return {
      emailSubject: `Contract for Signature: ${request.contractNumber}`,
      emailBlurb: 'Please review and sign this contract for your UGC collaboration.',
      documents: [
        {
          documentBase64: contractDocument,
          name: `Contract_${request.contractNumber}.pdf`,
          fileExtension: 'pdf',
          documentId: '1',
        },
      ],
      recipients: {
        signers: signers.map((signer, index) => ({
          email: signer.email,
          name: signer.name,
          recipientId: signer.recipientId,
          routingOrder: signer.routingOrder,
          tabs: {
            signHereTabs: [
              {
                documentId: '1',
                pageNumber: '1',
                xPosition: '100',
                yPosition: `${500 + (index * 100)}`,
              },
            ],
            dateSignedTabs: [
              {
                documentId: '1',
                pageNumber: '1',
                xPosition: '300',
                yPosition: `${500 + (index * 100)}`,
              },
            ],
          },
        })),
      },
      status: 'sent',
      metadata: {
        contractId: request.contractId,
        contractNumber: request.contractNumber,
      },
    };
  }

  /**
   * Generate contract document (as base64 PDF)
   */
  private generateContractDocument(request: ContractSignatureRequest): string {
    // In production, this would generate an actual PDF using a library like pdfkit
    // For now, we'll create a simple HTML that DocuSign can convert
    const contractHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            .section { margin: 20px 0; }
            .terms { background: #f5f5f5; padding: 15px; }
          </style>
        </head>
        <body>
          <h1>UGC Creator Contract</h1>
          <p><strong>Contract Number:</strong> ${request.contractNumber}</p>

          <div class="section">
            <h2>Contract Details</h2>
            <p><strong>Total Amount:</strong> ${request.contractData.currency} ${request.contractData.totalAmount}</p>
            <p><strong>Start Date:</strong> ${request.contractData.startDate.toDateString()}</p>
            <p><strong>End Date:</strong> ${request.contractData.endDate.toDateString()}</p>
          </div>

          <div class="section">
            <h2>Deliverables</h2>
            <ul>
              ${request.contractData.deliverables.map((d: any) => `<li>${JSON.stringify(d)}</li>`).join('')}
            </ul>
          </div>

          <div class="section terms">
            <h2>Terms & Conditions</h2>
            <pre>${JSON.stringify(request.contractData.terms, null, 2)}</pre>
          </div>

          <div class="section">
            <h2>Payment Terms</h2>
            <pre>${JSON.stringify(request.contractData.paymentTerms, null, 2)}</pre>
          </div>

          <div class="section">
            <h2>Signatures</h2>
            <p>Brand Representative: _________________________ Date: _____________</p>
            <p>Creator: _________________________ Date: _____________</p>
          </div>
        </body>
      </html>
    `;

    // Convert to base64
    return Buffer.from(contractHtml).toString('base64');
  }

  /**
   * Get envelope status
   */
  async getEnvelopeStatus(envelopeId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${config.docusign.apiBasePath}/v2.1/accounts/${config.docusign.accountId}/envelopes/${envelopeId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error getting envelope status:', error.response?.data || error);
      throw new AppError(500, 'Failed to get envelope status');
    }
  }

  /**
   * Get signed document
   */
  async getSignedDocument(envelopeId: string, documentId: string = '1'): Promise<Buffer> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `${config.docusign.apiBasePath}/v2.1/accounts/${config.docusign.accountId}/envelopes/${envelopeId}/documents/${documentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: 'arraybuffer',
        }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      logger.error('Error getting signed document:', error.response?.data || error);
      throw new AppError(500, 'Failed to retrieve signed document');
    }
  }

  /**
   * Void an envelope (cancel contract signing)
   */
  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      await axios.put(
        `${config.docusign.apiBasePath}/v2.1/accounts/${config.docusign.accountId}/envelopes/${envelopeId}`,
        {
          status: 'voided',
          voidedReason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Envelope voided: ${envelopeId}`);
    } catch (error: any) {
      logger.error('Error voiding envelope:', error.response?.data || error);
      throw new AppError(500, 'Failed to void envelope');
    }
  }

  /**
   * Handle DocuSign webhook
   */
  async handleWebhook(payload: any): Promise<void> {
    try {
      const event = payload.event;
      const envelopeId = payload.data?.envelopeId;

      logger.info(`DocuSign webhook received: ${event} for envelope ${envelopeId}`);

      switch (event) {
        case 'envelope-completed':
          await this.handleEnvelopeCompleted(payload.data);
          break;
        case 'envelope-declined':
          await this.handleEnvelopeDeclined(payload.data);
          break;
        case 'envelope-voided':
          await this.handleEnvelopeVoided(payload.data);
          break;
        case 'recipient-completed':
          await this.handleRecipientCompleted(payload.data);
          break;
        default:
          logger.info(`Unhandled DocuSign event: ${event}`);
      }
    } catch (error) {
      logger.error('Error handling DocuSign webhook:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getSignersInfo(brandId: string, creatorId: string): Promise<Signer[]> {
    // In production, fetch actual user details from database
    return [
      {
        email: `brand-${brandId}@example.com`,
        name: 'Brand Representative',
        recipientId: '1',
        routingOrder: '1',
      },
      {
        email: `creator-${creatorId}@example.com`,
        name: 'Content Creator',
        recipientId: '2',
        routingOrder: '2',
      },
    ];
  }

  private async handleEnvelopeCompleted(data: any): Promise<void> {
    logger.info('Envelope completed:', data);
    // Update contract status in database
  }

  private async handleEnvelopeDeclined(data: any): Promise<void> {
    logger.info('Envelope declined:', data);
    // Update contract status and notify parties
  }

  private async handleEnvelopeVoided(data: any): Promise<void> {
    logger.info('Envelope voided:', data);
    // Update contract status
  }

  private async handleRecipientCompleted(data: any): Promise<void> {
    logger.info('Recipient completed signing:', data);
    // Update individual signature status
  }
}

export default new DocuSignIntegration();
