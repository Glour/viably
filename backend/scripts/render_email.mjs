#!/usr/bin/env node
/**
 * Email Template Renderer for Python Backend (ESM version)
 *
 * This script renders React Email templates to HTML using dynamic imports.
 * It runs from the frontend directory to access node_modules.
 *
 * Usage:
 *   node render_email.mjs <template-name> <props-json>
 *
 * Example:
 *   node render_email.mjs welcome '{"userName":"Alex","credits":100}'
 *
 * Output:
 *   Prints rendered HTML to stdout
 *   Exits with 0 on success, 1 on failure
 */

import { render } from '@react-email/render';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node render_email.mjs <template-name> <props-json>');
  process.exit(1);
}

const templateName = args[0];
const propsJson = args[1];

// Parse props
let props;
try {
  props = JSON.parse(propsJson);
} catch (error) {
  console.error(`Failed to parse props JSON: ${error.message}`);
  process.exit(1);
}

// Main render function
async function renderTemplate() {
  try {
    // Dynamically import template based on name
    let EmailComponent;

    switch (templateName) {
      case 'welcome':
        const welcomeModule = await import('../../frontend/emails/welcome.tsx');
        EmailComponent = welcomeModule.default;
        break;
      case 'generation-complete':
        const genModule = await import('../../frontend/emails/generation-complete.tsx');
        EmailComponent = genModule.default || genModule.GenerationCompleteEmail;
        break;
      case 'deploy-success':
        const deployModule = await import('../../frontend/emails/deploy-success.tsx');
        EmailComponent = deployModule.default || deployModule.DeploySuccessEmail;
        break;
      case 'low-credits':
        const creditsModule = await import('../../frontend/emails/low-credits.tsx');
        EmailComponent = creditsModule.default;
        break;
      default:
        throw new Error(
          `Unknown template: ${templateName}. Available: welcome, generation-complete, deploy-success, low-credits`
        );
    }

    if (!EmailComponent) {
      throw new Error(`Template ${templateName} does not export a valid component`);
    }

    // Render the component with props
    const html = await render(EmailComponent(props));

    // Output the rendered HTML
    console.log(html);

    process.exit(0);
  } catch (error) {
    console.error(`Failed to render template: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the renderer
renderTemplate();
