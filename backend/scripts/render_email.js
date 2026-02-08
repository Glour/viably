#!/usr/bin/env node
/**
 * Email Template Renderer for Python Backend
 *
 * This script is called by the Python backend to render React Email templates
 * into HTML strings. It uses @react-email/render to convert React components
 * to production-ready HTML.
 *
 * Usage:
 *   node render_email.js <template-name> <props-json>
 *
 * Example:
 *   node render_email.js welcome '{"userName":"Alex","credits":100}'
 *
 * Output:
 *   Prints rendered HTML to stdout
 *   Prints errors to stderr
 *   Exits with 0 on success, 1 on failure
 *
 * Note: This script must be run from the frontend directory where
 * node_modules and @react-email packages are installed.
 */

const { render } = require('@react-email/render');
const path = require('path');

// Get arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node render_email.js <template-name> <props-json>');
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
    // Templates are in emails/ subdirectory (relative to frontend/)
    const templatePath = path.join(__dirname, '../../frontend/emails', templateName);

    // Check if template exists (try .tsx first, then .jsx)
    const fs = require('fs');
    let fullTemplatePath = `${templatePath}.tsx`;
    if (!fs.existsSync(fullTemplatePath)) {
      fullTemplatePath = `${templatePath}.jsx`;
      if (!fs.existsSync(fullTemplatePath)) {
        throw new Error(`Template not found: ${templateName}.tsx or ${templateName}.jsx`);
      }
    }

    // Dynamic import using ESM (async)
    // Note: This requires Node.js 14+ with ES modules support
    // For .tsx files, we need to use a loader or compile them first
    // Simpler approach: Use the compiled index.ts exports

    // Import from emails/index which has all exports
    const emailTemplates = require('../../frontend/emails/index.ts');

    // Map template names to exports
    const templateMap = {
      'welcome': emailTemplates.WelcomeEmail,
      'generation-complete': emailTemplates.GenerationCompleteEmail,
      'deploy-success': emailTemplates.DeploySuccessEmail,
      'low-credits': emailTemplates.LowCreditsEmail,
    };

    const EmailComponent = templateMap[templateName];

    if (!EmailComponent) {
      throw new Error(
        `Template ${templateName} not found. Available: ${Object.keys(templateMap).join(', ')}`
      );
    }

    // Render the component with props
    // render() expects a React element, so we call the component function
    const html = render(EmailComponent(props));

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
