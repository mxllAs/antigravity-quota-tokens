/**
 * Webview HTML & Asset Loader for Antigravity Quota & Token Monitor.
 * Loads modular frontend views (index.html, style.css, app.js).
 * Supports:
 * 1. VS Code Webview with asWebviewUri for style.css & app.js (CSP compliant).
 * 2. Standalone fallback (inlines CSS and JS if webview/extensionUri not provided).
 */

const fs = require('fs');
const path = require('path');
let vscode;
try {
  vscode = require('vscode');
} catch (e) {
  // Standalone / test environment
}

/**
 * Generates or loads the Webview HTML content.
 * 
 * @param {any} [webview] - The webview instance
 * @param {any} [extensionUri] - Extension URI for local resource resolution
 * @returns {string} The complete HTML string
 */
function getWebviewHtml(webview, extensionUri) {
  const viewsDir = path.join(__dirname, 'views');
  const htmlFile = path.join(viewsDir, 'index.html');
  const cssFile = path.join(viewsDir, 'style.css');
  const jsFile = path.join(viewsDir, 'app.js');

  let html = fs.readFileSync(htmlFile, 'utf8');

  if (webview && extensionUri && vscode && vscode.Uri && vscode.Uri.joinPath) {
    // Generate webview-safe URIs
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'views', 'style.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'src', 'views', 'app.js'));

    // Generate nonce for CSP
    const nonce = getNonce();

    // Inject CSP into <head>
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource};">`;
    html = html.replace('<head>', `<head>\n  ${csp}`);

    // Replace relative paths with Webview URIs
    html = html.replace('<link rel="stylesheet" href="./style.css">', `<link rel="stylesheet" href="${styleUri}">`);
    html = html.replace('<script src="./app.js"></script>', `<script nonce="${nonce}" src="${scriptUri}"></script>`);
  } else {
    // Fallback: Inline mode (for tests or standalone preview without VS Code Webview context)
    const cssContent = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, 'utf8') : '';
    const jsContent = fs.existsSync(jsFile) ? fs.readFileSync(jsFile, 'utf8') : '';

    html = html.replace('<link rel="stylesheet" href="./style.css">', `<style>\n${cssContent}\n</style>`);
    html = html.replace('<script src="./app.js"></script>', `<script>\n${jsContent}\n</script>`);
  }

  return html;
}

/**
 * Generate a random 32-character nonce for Content-Security-Policy.
 */
function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

module.exports = {
  getWebviewHtml,
};
