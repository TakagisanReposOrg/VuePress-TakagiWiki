import { AstroIntegrationConfig } from '@unocss/astro';
import { AstroIntegration } from 'astro';

declare function UnocssAstroIntegration<Theme extends {}>(config?: AstroIntegrationConfig<Theme>): AstroIntegration;

export { UnocssAstroIntegration as default };
