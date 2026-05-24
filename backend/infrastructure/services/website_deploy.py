"""Website deployment service for static site deployments via nginx subdomains.
"""
import asyncio
import logging
import shutil
import tempfile
from pathlib import Path
from typing import Optional

from settings.config import settings

logger = logging.getLogger(__name__)

SITES_BASE_DIR = Path("/opt/viably-sites")
NGINX_SITES_DIR = Path("/etc/nginx/sites-enabled")
DOMAIN = settings.DEPLOY_DOMAIN
SSL_ENABLED = settings.DEPLOY_SSL_ENABLED


class WebsiteDeployClient:
    """Client for managing static website deployments via nginx subdomains."""

    def __init__(self) -> None:
        self.sites_dir = SITES_BASE_DIR
        self.sites_dir.mkdir(parents=True, exist_ok=True)

    async def _run_command(
        self, cmd: list[str], timeout: int = 30
    ) -> tuple[int, str, str]:
        """Run a shell command asynchronously."""
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            return proc.returncode or 0, stdout.decode(), stderr.decode()
        except asyncio.TimeoutError:
            proc.kill()
            return 1, "", "Command timed out"

    async def _reload_nginx(self) -> bool:
        """Reload nginx on the host via docker + nsenter."""
        code, stdout, stderr = await self._run_command([
            "docker", "run", "--rm", "--pid=host", "--privileged",
            "alpine:3.19", "nsenter", "-t", "1", "-m", "-u", "-n", "-i",
            "--", "nginx", "-s", "reload",
        ])
        if code != 0:
            logger.error("Failed to reload nginx: %s", stderr)
            return False
        logger.info("Nginx reloaded successfully")
        return True

    def _generate_nginx_config_http(self, subdomain: str) -> str:
        """Generate HTTP-only nginx config (before SSL cert is issued)."""
        fqdn = f"{subdomain}.{DOMAIN}"
        root = f"/opt/viably-sites/{subdomain}"
        return f"""server {{
    listen 80;
    server_name {fqdn};
    root {root};
    index index.html;

    location /.well-known/acme-challenge/ {{
        root {root};
    }}

    location / {{
        try_files $uri $uri/ /index.html;
    }}
}}
"""

    def _generate_nginx_config(self, subdomain: str, custom_domain: str | None = None) -> str:
        """Generate HTTPS nginx server block (after SSL cert is issued)."""
        fqdn = f"{subdomain}.{DOMAIN}"
        root = f"/opt/viably-sites/{subdomain}"
        cert_domain = custom_domain if custom_domain else fqdn

        server_names = fqdn
        if custom_domain:
            server_names = f"{fqdn} {custom_domain} www.{custom_domain}"

        cert_path = f"/etc/letsencrypt/live/{cert_domain}/fullchain.pem"
        key_path = f"/etc/letsencrypt/live/{cert_domain}/privkey.pem"

        return f"""server {{
    listen 80;
    server_name {server_names};
    return 301 https://$host$request_uri;
}}
server {{
    listen 443 ssl;
    server_name {server_names};
    ssl_certificate {cert_path};
    ssl_certificate_key {key_path};
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    root {root};
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location ~* \\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {{
        expires 30d;
        add_header Cache-Control "public, immutable";
    }}
}}
"""

    @staticmethod
    def _is_react_project(files: dict[str, str]) -> bool:
        """Detect if the project is a React/Vite app that needs to be compiled."""
        has_package_json = "package.json" in files
        has_vite = "vite.config.ts" in files or "vite.config.js" in files
        has_tsx = any(f.endswith(".tsx") or f.endswith(".jsx") for f in files)
        return has_package_json and (has_vite or has_tsx)

    async def _build_react_project(
        self, files: dict[str, str], subdomain: str
    ) -> tuple[bool, str, Path]:
        """Write React source files, run npm build via Docker, return dist path.

        Returns:
            (success, error_message, dist_dir_path)
        """
        build_src = Path("/opt/viably-deploys") / f"{subdomain}-src"
        if build_src.exists():
            shutil.rmtree(build_src)
        build_src.mkdir(parents=True)

        # Write all source files
        for filepath, content in files.items():
            file_path = build_src / filepath
            file_path.parent.mkdir(parents=True, exist_ok=True)
            lines = content.splitlines(keepends=True)
            if lines and lines[0].startswith("# filename:"):
                content = "".join(lines[1:])
            file_path.write_text(content)

        logger.info("Running npm build for %s in %s", subdomain, build_src)
        cmd = [
            "docker", "run", "--rm",
            "-v", f"{build_src}:/app",
            "--network=host",
            "node:20-alpine",
            "sh", "-c",
            "cd /app && (npm ci --ignore-scripts 2>/dev/null || npm install) && npm run build",
        ]
        code, stdout, stderr = await self._run_command(cmd, timeout=300)
        if code != 0:
            err = (stderr or stdout)[-2000:]
            logger.error("npm build failed for %s: %s", subdomain, err)
            return False, f"npm build failed:\n{err}", build_src

        dist_dir = build_src / "dist"
        if not dist_dir.exists():
            # Some projects output to 'build/' instead of 'dist/'
            alt = build_src / "build"
            if alt.exists():
                dist_dir = alt
            else:
                return False, "Build succeeded but no dist/ or build/ directory found", build_src

        logger.info("npm build succeeded for %s, dist: %s", subdomain, dist_dir)
        return True, "", dist_dir

    async def deploy(
        self,
        project_id: str,
        files: dict[str, str],
        subdomain: str,
        **kwargs,
    ) -> dict:
        """Deploy static files as a website on a subdomain.

        Args:
            project_id: Unique project identifier
            files: Dict of filename -> content
            subdomain: Subdomain name (e.g. 'mysite' -> mysite.viably.dev)

        Returns:
            Dict with deployment info
        """
        subdomain = subdomain.lower().strip()
        site_dir = self.sites_dir / subdomain
        fqdn = f"{subdomain}.{DOMAIN}"
        nginx_conf_path = NGINX_SITES_DIR / f"{fqdn}"

        # Clean existing site
        if site_dir.exists():
            shutil.rmtree(site_dir)
        site_dir.mkdir(parents=True)

        # React/Vite project: compile first, serve dist/
        if self._is_react_project(files):
            logger.info("Detected React/Vite project for %s — running npm build", subdomain)
            success, err, dist_dir = await self._build_react_project(files, subdomain)
            if not success:
                return {"status": "failed", "error": err}
            # Copy built dist/ → site_dir
            shutil.copytree(str(dist_dir), str(site_dir), dirs_exist_ok=True)
            logger.info("Copied built dist to %s", site_dir)
        else:
            # Static files: write directly
            for filepath, content in files.items():
                file_path = site_dir / filepath
                file_path.parent.mkdir(parents=True, exist_ok=True)
                # Strip AI-generated "# filename: ..." header comments if present
                lines = content.splitlines(keepends=True)
                if lines and lines[0].startswith("# filename:"):
                    content = "".join(lines[1:])
                file_path.write_text(content)

        # Ensure index.html exists
        if not (site_dir / "index.html").exists():
            # Check if there's an index file in a subdirectory
            html_files = list(site_dir.rglob("index.html"))
            if not html_files:
                logger.warning("No index.html found in deployed files for %s", subdomain)

        # Step 1: Write HTTP-only nginx config (needed for certbot HTTP challenge)
        http_config = self._generate_nginx_config_http(subdomain)
        nginx_conf_path.write_text(http_config)
        logger.info("Wrote HTTP nginx config to %s", nginx_conf_path)

        # Reload nginx with HTTP config
        reloaded = await self._reload_nginx()
        if not reloaded:
            return {"status": "failed", "error": "Failed to reload nginx (HTTP)"}

        # If SSL is disabled (dev environment), stop here with HTTP-only
        if not SSL_ENABLED:
            deploy_url = f"http://{fqdn}"
            logger.info("SSL disabled — deployed HTTP-only: %s", deploy_url)
            return {
                "status": "active",
                "url": deploy_url,
                "subdomain": subdomain,
                "fqdn": fqdn,
                "site_dir": str(site_dir),
            }

        # Step 2: Obtain SSL certificate via certbot
        certbot_cmd = [
            "docker", "run", "--rm", "--pid=host", "--privileged",
            "--network=host",
            "alpine:3.19", "nsenter", "-t", "1", "-m", "-u", "-n", "-i",
            "--", "certbot", "certonly",
            "--nginx",
            "--non-interactive",
            "--agree-tos",
            "--email", f"admin@{DOMAIN}",
            "-d", fqdn,
        ]
        code, stdout, stderr = await self._run_command(certbot_cmd, timeout=120)
        if code != 0:
            logger.warning("Certbot failed for %s: %s", fqdn, stderr)
            # Fall back to HTTP-only deployment
            deploy_url = f"http://{fqdn}"
            return {
                "status": "active",
                "url": deploy_url,
                "subdomain": subdomain,
                "fqdn": fqdn,
                "site_dir": str(site_dir),
            }
        logger.info("Certbot issued cert for %s", fqdn)

        # Step 3: Write HTTPS nginx config
        https_config = self._generate_nginx_config(subdomain)
        nginx_conf_path.write_text(https_config)

        reloaded = await self._reload_nginx()
        if not reloaded:
            return {"status": "failed", "error": "Failed to reload nginx (HTTPS)"}

        deploy_url = f"https://{fqdn}"

        return {
            "status": "active",
            "url": deploy_url,
            "subdomain": subdomain,
            "fqdn": fqdn,
            "site_dir": str(site_dir),
        }

    async def set_custom_domain(
        self, subdomain: str, custom_domain: str
    ) -> dict:
        """Add a custom domain to an existing deployment.

        This updates the nginx config and triggers certbot for SSL.
        The custom domain must already have a CNAME → fqdn configured.
        """
        site_dir = self.sites_dir / subdomain
        if not site_dir.exists():
            return {"status": "failed", "error": "Site not found"}

        fqdn = f"{subdomain}.{DOMAIN}"
        nginx_conf_path = NGINX_SITES_DIR / f"{fqdn}"

        if not SSL_ENABLED:
            # HTTP-only: write HTTP config with custom domain server_name
            http_config = self._generate_nginx_config_http(subdomain)
            nginx_conf_path.write_text(http_config)
            await self._reload_nginx()
            return {
                "status": "active",
                "custom_domain": custom_domain,
                "url": f"http://{custom_domain}",
            }

        # Step 1: Write HTTP config first (needed for certbot challenge)
        http_config = self._generate_nginx_config_http(subdomain)
        nginx_conf_path.write_text(http_config)
        await self._reload_nginx()

        # Step 2: Request Let's Encrypt certificate via certbot
        certbot_cmd = [
            "docker", "run", "--rm", "--pid=host", "--privileged",
            "--network=host",
            "alpine:3.19", "nsenter", "-t", "1", "-m", "-u", "-n", "-i",
            "--", "certbot", "certonly",
            "--nginx",
            "--non-interactive",
            "--agree-tos",
            "--email", f"admin@{DOMAIN}",
            "-d", custom_domain,
            "-d", f"www.{custom_domain}",
        ]
        code, stdout, stderr = await self._run_command(certbot_cmd, timeout=120)
        if code != 0:
            logger.warning("Certbot failed (cert may already exist or DNS not ready): %s", stderr)
            # Keep HTTP-only config — don't write HTTPS without cert
            return {
                "status": "active",
                "custom_domain": custom_domain,
                "url": f"http://{custom_domain}",
                "certbot_output": stderr,
            }

        # Step 3: Write HTTPS config only after cert is obtained
        https_config = self._generate_nginx_config(subdomain, custom_domain)
        nginx_conf_path.write_text(https_config)
        await self._reload_nginx()

        return {
            "status": "active",
            "custom_domain": custom_domain,
            "url": f"https://{custom_domain}",
            "certbot_output": stdout or stderr,
        }

    async def remove_custom_domain(self, subdomain: str) -> dict:
        """Remove custom domain from a deployment (revert to subdomain only)."""
        fqdn = f"{subdomain}.{DOMAIN}"
        nginx_conf_path = NGINX_SITES_DIR / f"{fqdn}"

        if SSL_ENABLED:
            # Revert to HTTPS config with subdomain only
            nginx_config = self._generate_nginx_config(subdomain, custom_domain=None)
        else:
            # Revert to HTTP-only config
            nginx_config = self._generate_nginx_config_http(subdomain)

        nginx_conf_path.write_text(nginx_config)
        await self._reload_nginx()

        return {"status": "ok"}

    async def stop(self, project_id: str, subdomain: Optional[str] = None) -> bool:
        """Remove a deployed website."""
        # If subdomain not provided, try to find it from the sites dir
        if not subdomain:
            # Try to find by checking nginx configs for project references
            # Fallback: use project_id as subdomain
            subdomain = project_id[:8]

        fqdn = f"{subdomain}.{DOMAIN}"
        site_dir = self.sites_dir / subdomain
        nginx_conf_path = NGINX_SITES_DIR / f"{fqdn}"

        if site_dir.exists():
            shutil.rmtree(site_dir)
        if nginx_conf_path.exists():
            nginx_conf_path.unlink()

        await self._reload_nginx()
        return True

    async def get_status(self, project_id: str, subdomain: Optional[str] = None) -> dict:
        """Check if a website deployment exists and is configured."""
        if not subdomain:
            subdomain = project_id[:8]

        fqdn = f"{subdomain}.{DOMAIN}"
        site_dir = self.sites_dir / subdomain
        nginx_conf_path = NGINX_SITES_DIR / f"{fqdn}"

        if not nginx_conf_path.exists():
            return {"status": "not_found"}

        has_index = (site_dir / "index.html").exists() if site_dir.exists() else False
        protocol = "https" if SSL_ENABLED else "http"

        return {
            "status": "active" if has_index else "misconfigured",
            "subdomain": subdomain,
            "fqdn": fqdn,
            "url": f"{protocol}://{fqdn}",
            "has_files": site_dir.exists(),
            "has_index": has_index,
        }
