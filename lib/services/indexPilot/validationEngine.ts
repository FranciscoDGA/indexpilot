import { ValidationResult } from '@/types/indexPilot';

export class ValidationEngine {
  /**
   * Validate a URL before indexing
   */
  async validateUrl(url: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const checks = {
      validUrl: false,
      httpsEnabled: false,
      statusCode200: false,
      canonicalPresent: false,
      robotsTxtOkay: false,
      noindexAbsent: false,
      sitemapPresent: false,
    };

    // Check 1: Valid URL format
    try {
      const urlObj = new URL(url);
      checks.validUrl = true;
    } catch (err) {
      errors.push('URL inválida');
      return { passed: false, errors, warnings, checks };
    }

    // Check 2: HTTPS enabled
    if (url.startsWith('https://')) {
      checks.httpsEnabled = true;
    } else {
      warnings.push('URL não usa HTTPS (recomendado)');
    }

    // Check 3: HTTP Status 200
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 200) {
        checks.statusCode200 = true;
      } else if (response.status === 404) {
        errors.push('URL retorna 404 (não encontrada)');
      } else if (response.status >= 400) {
        errors.push(`URL retorna erro HTTP ${response.status}`);
      }
    } catch (err) {
      errors.push('Erro ao verificar acesso à URL');
    }

    // Check 4: Canonical tag
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const html = await response.text();

      if (html.includes('rel="canonical"') || html.includes("rel='canonical'")) {
        checks.canonicalPresent = true;
      } else {
        warnings.push('Canonical tag não encontrada');
      }

      if (html.includes('noindex') || html.includes('nofollow')) {
        checks.noindexAbsent = false;
        errors.push('URL contém noindex ou nofollow');
      } else {
        checks.noindexAbsent = true;
      }
    } catch (err) {
      warnings.push('Não foi possível verificar meta tags');
    }

    // Check 5: robots.txt
    const robotsUrl = new URL(url).origin + '/robots.txt';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const robotsResponse = await fetch(robotsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (robotsResponse.ok) {
        const robotsContent = await robotsResponse.text();
        if (!robotsContent.includes('Disallow: /')) {
          checks.robotsTxtOkay = true;
        } else {
          warnings.push('Verificar robots.txt - pode bloquear rastreamento');
        }
      }
    } catch (err) {
      warnings.push('robots.txt não encontrado (normal)');
    }

    // Check 6: sitemap.xml
    const sitemapUrl = new URL(url).origin + '/sitemap.xml';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const sitemapResponse = await fetch(sitemapUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (sitemapResponse.ok) {
        checks.sitemapPresent = true;
      }
    } catch (err) {
      warnings.push('sitemap.xml não encontrado');
    }

    const passed = errors.length === 0 && checks.statusCode200 && checks.validUrl;

    return {
      passed,
      errors,
      warnings,
      checks,
    };
  }

  /**
   * Check if URL is already in queue/processed
   */
  async isUrlDuplicate(url: string, siteId: string): Promise<boolean> {
    // This will be implemented with database check
    return false;
  }

  /**
   * Normalize URL (remove query params, fragments, etc)
   */
  normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove query parameters and fragments for consistency
      return urlObj.origin + urlObj.pathname;
    } catch {
      return url;
    }
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}

export const validationEngine = new ValidationEngine();
