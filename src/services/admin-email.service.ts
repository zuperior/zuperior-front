/**
 * Admin Email Service
 * Fetches email templates from zuperior-admin-back and renders them with real data
 */

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_ZUPERIOR_ADMIN_API_URL || 'http://localhost:5003';
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || process.env.NEXT_PUBLIC_EMAIL_API_KEY;

// Template cache with TTL
interface CachedTemplate {
  data: EmailTemplate;
  timestamp: number;
}

interface EmailTemplate {
  id: number;
  name: string;
  html_code: string;
  variables?: string[];
  from_email?: string;
  email_type?: string;
  category?: string;
}

const templateCache = new Map<string, CachedTemplate>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached template or fetch from API
 */
const getCachedTemplate = async (emailType: string): Promise<EmailTemplate | null> => {
  const cacheKey = `template:${emailType}`;
  const cached = templateCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Using cached template for type: ${emailType}`);
    return cached.data;
  }

  try {
    const url = `${ADMIN_API_URL}/api/email-templates/by-type/${emailType}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (ADMIN_API_KEY) {
      headers['X-API-Key'] = ADMIN_API_KEY;
    }

    const response = await fetch(url, { headers });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data?.ok && data.template) {
        const template = data.template;
        
        // Cache the template
        templateCache.set(cacheKey, {
          data: template,
          timestamp: Date.now(),
        });
        
        console.log(`✅ Fetched template from admin API for type: ${emailType}`);
        return template;
      }
    }
    
    return null;
  } catch (error: any) {
    console.warn(`⚠️ Failed to fetch template from admin API for type: ${emailType}`, {
      message: error.message,
    });
    return null;
  }
};

/**
 * Fetch template by email type from admin API
 */
export const fetchTemplateByType = async (emailType: string): Promise<EmailTemplate | null> => {
  if (!emailType) {
    return null;
  }

  return await getCachedTemplate(emailType);
};

/**
 * Render template by replacing {{variableName}} placeholders with actual values
 */
export const renderTemplate = (templateHtml: string, variables: Record<string, any> = {}): string => {
  if (!templateHtml) {
    return '';
  }

  let rendered = templateHtml;

  // Replace all {{variableName}} with actual values
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const value = variables[key] !== null && variables[key] !== undefined 
      ? String(variables[key]) 
      : '';
    rendered = rendered.replace(regex, value);
  });

  return rendered;
};

/**
 * Build common variables for email templates
 */
export const buildCommonVariables = (options: {
  recipientName?: string;
  recipientEmail?: string;
}): Record<string, string> => {
  const clientBase = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://dashboard.zuperior.com';
  const explicitLogo = process.env.NEXT_PUBLIC_EMAIL_LOGO_URL;
  let logoUrl = explicitLogo || `${clientBase.replace(/\/$/, '')}/logo.png`;
  logoUrl = logoUrl.replace(/https?:\/\/[^/]+\/(https?:\/\/.*)/, '$1');

  return {
    recipientName: options.recipientName || 'Trader',
    recipientEmail: options.recipientEmail || '',
    logoUrl,
    companyName: 'Zuperior FX Limited',
    companyEmail: process.env.NEXT_PUBLIC_FROM_EMAIL || 'info@zuperior.com',
    companyPhone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '+44 7868 811937',
    currentYear: new Date().getFullYear().toString(),
  };
};

/**
 * Get default sender email from admin API
 */
export const getDefaultSenderEmail = async (): Promise<{ email_address: string; display_name: string }> => {
  try {
    const url = `${ADMIN_API_URL}/api/sender-emails/default`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (ADMIN_API_KEY) {
      headers['X-API-Key'] = ADMIN_API_KEY;
    }

    const response = await fetch(url, { headers });
    
    if (response.ok) {
      const data = await response.json();
      if (data?.ok && data.senderEmail) {
        return data.senderEmail;
      }
    }
    
    // Fallback
    return {
      email_address: process.env.NEXT_PUBLIC_FROM_EMAIL || 'info@zuperior.com',
      display_name: 'Zuperior CRM',
    };
  } catch (error: any) {
    console.warn('⚠️ Failed to fetch default sender email from admin API:', error.message);
    // Fallback
    return {
      email_address: process.env.NEXT_PUBLIC_FROM_EMAIL || 'info@zuperior.com',
      display_name: 'Zuperior CRM',
    };
  }
};

/**
 * Clear template cache (useful for testing or forced refresh)
 */
export const clearTemplateCache = (): void => {
  templateCache.clear();
  console.log('🗑️ Template cache cleared');
};

export default {
  fetchTemplateByType,
  renderTemplate,
  buildCommonVariables,
  getDefaultSenderEmail,
  clearTemplateCache,
};

