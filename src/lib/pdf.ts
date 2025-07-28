import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer'

export interface PDFGenerationOptions {
  format?: 'A4' | 'A3' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
  printBackground?: boolean
}

export class PDFService {
  private static browser: Browser | null = null

  private static async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
      })
    }
    return this.browser
  }

  static async generatePDFFromHTML(
    html: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      // Create complete HTML document
      const fullHtml = html.includes('<!DOCTYPE html>') ? html : `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PDF Document</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .page-break { page-break-before: always; }
              .no-page-break { page-break-inside: avoid; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #1f2937;
            }
            .loading-spinner {
              border: 2px solid #f3f3f3;
              border-top: 2px solid #3498db;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `

      // Set page content
      await page.setContent(fullHtml, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      })

      // Default PDF options
      const defaultOptions: PDFOptions = {
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        margin: {
          top: '20mm',
          right: '15mm', 
          bottom: '20mm',
          left: '15mm',
          ...options.margin
        },
        printBackground: options.printBackground !== false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
      }

      // Generate PDF
      const pdfBuffer = await page.pdf(defaultOptions)
      
      return Buffer.from(pdfBuffer)
    } finally {
      await page.close()
    }
  }


  static async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

// Default company information
export const DEFAULT_COMPANY_INFO = {
  name: 'GS Manufacturing Solutions',
  address: '123 Industrial District, Manufacturing Zone, Istanbul, Turkey',
  phone: '+90 212 555 0123',
  email: 'info@gsmanufacturing.com',
  website: 'www.gsmanufacturing.com',
  logo: '/logo.png' // Should be placed in public folder
}

// Helper function to generate quote number
export const generateQuoteNumber = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `QT-${year}${month}${day}-${random}`
}

// Helper function to calculate quote validity date
export const getQuoteValidityDate = (daysValid: number = 30): Date => {
  const date = new Date()
  date.setDate(date.getDate() + daysValid)
  return date
}