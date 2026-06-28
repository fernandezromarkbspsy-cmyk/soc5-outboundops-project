# AWS Free Tier Hosting Guide — SOC 5 Outbound

This guide deploys SOC 5 Outbound to one Amazon EC2 instance, with Cloudflare
managing DNS and edge traffic and Supabase providing PostgreSQL and Auth. It is
written for the AWS Console UI available in June 2026.

This architecture is intended for a low-traffic internal MVP. It is not highly
available: deployments, instance failures, and maintenance can cause downtime.

## Architecture

```text
Browser
  |
  | HTTPS
  v
Cloudflare DNS and proxy
  |
  | HTTPS, Full (strict)
  v
EC2 Ubuntu host NGINX
  |
  | http://127.0.0.1:8080
  v
Docker Compose
  +-- React static files on NGINX
  +-- Laravel API
          |
          +-- Supabase Auth API
          +-- Supabase PostgreSQL pooler
```

The production URL is `https://soc5outboundops.app`.

## 1. Understand the current AWS Free Tier

AWS changed its Free Tier on July 15, 2025:

- Accounts created before that date use the legacy 12-month Free Tier and must
  remain within each service's allowance.
- New accounts created on or after that date receive credits and a Free or Paid
  account plan. The Free plan ends after six months or when credits are used.

Free Tier does not mean permanently free. Running resources can become billable
when credits, eligibility, or time limits expire. Public IPv4 addresses, EBS
storage, snapshots, data transfer, and excess CloudWatch usage can incur costs.

Before creating resources:

1. Open the AWS Console.
2. Search for **Billing and Cost Management**.
3. Open **Free Tier** and record the expiration date and credit balance.
4. Open **Billing preferences > Alert preferences > Edit**.
5. Enable **Receive AWS Free Tier alerts** and **Receive CloudWatch billing
   alerts**, if available for the account.
6. Open **Budgets > Create budget**.
7. Choose **Use a template (simplified)**.
8. Select **Zero spend budget** and enter the billing-alert email.
9. Create a second **Monthly cost budget** with a small limit you accept, such as
   USD 5, and notifications at 50%, 80%, and 100%.

AWS budgets notify you; they do not automatically stop the instance.

## 2. Secure the AWS account

1. Sign in as the root user only for initial account security.
2. Open the account menu > **Security credentials**.
3. Enable MFA for the root user.
4. Search for **IAM**.
5. Create an administrative user for daily work and enable MFA for it.
6. Do not create long-lived access keys unless a deployment process actually
   needs them.
7. Store recovery codes, the EC2 private key, and credentials in an approved
   password manager.

## 3. Confirm external services first

Before AWS deployment, complete:

- Supabase migrations 001, 002, and 003.
- `users-seed.sql` and `clusters-seed.sql`.
- Supabase Email provider, OTP template, Site URL, SMTP, and rate limits.
- Cloudflare nameserver delegation from Name.com.

Follow [Supabase Auth Setup](supabase-auth-setup.md).

Use the Supabase transaction pooler for this deployment:

```text
Host: aws-0-ap-southeast-1.pooler.supabase.com
Port: 6543
Database: postgres
Username: value shown by Supabase Connect
```

Copy the exact values from **Supabase Dashboard > Connect**. Do not infer the
project-specific username.

## 4. Select the AWS Region

In the AWS Console region selector, choose **Asia Pacific (Singapore)**,
`ap-southeast-1`. Keeping EC2 near the Supabase Singapore endpoint reduces
database latency.

All EC2 resources in this guide must be created in the same region.

## 5. Create an EC2 key pair

1. Search for **EC2** and open it.
2. In the left navigation, open **Network & Security > Key Pairs**.
3. Choose **Create key pair**.
4. Name: `soc5-outbound-prod`.
5. Key pair type: **ED25519** if offered for the selected Linux AMI; otherwise
   use RSA.
6. Private key format:
   - `.pem` for OpenSSH, PowerShell `ssh`, or WSL
   - `.ppk` only when using PuTTY
7. Choose **Create key pair** and save the downloaded private key securely.

AWS does not retain a recoverable copy of the private key.

On Windows, the browser normally saves the PEM file under `Downloads`. Keep it
outside the Git repository. Set `$Pem` to its actual full path, verify it exists,
and then restrict access:

```powershell
$Pem = "$env:USERPROFILE\Downloads\soc5-outbound-prod.pem"
Test-Path -LiteralPath $Pem
icacls $Pem /inheritance:r
icacls $Pem /grant:r "$($env:USERNAME):(R)"
```

`Test-Path` must return `True`. A relative path such as
`.\soc5-outbound-prod.pem` looks only in the current PowerShell directory.

## 6. Create the EC2 security group

1. In EC2, open **Network & Security > Security Groups**.
2. Choose **Create security group**.
3. Name: `soc5-outbound-web`.
4. Description: `SOC 5 Outbound HTTPS and restricted SSH`.
5. Select the default VPC.
6. Add inbound rules:

| Type | Port | Source | Purpose |
|---|---:|---|---|
| SSH | 22 | **My IP** | Administration only |
| HTTP | 80 | `0.0.0.0/0` | Redirect and certificate support |
| HTTPS | 443 | `0.0.0.0/0` | Cloudflare-to-origin traffic |

Do not allow SSH from `0.0.0.0/0`. Update the SSH source when the administrator's
public IP changes.

The simple rules above allow direct origin access. After deployment is stable,
restrict ports 80 and 443 to Cloudflare's published IPv4 and IPv6 ranges. Keep
those ranges updated when Cloudflare changes them.

Leave outbound traffic allowed so the server can reach package repositories,
Supabase, and SMTP-related endpoints.

## 7. Launch the EC2 instance using the current console

1. Open **EC2 > Instances > Launch instances**.
2. **Name and tags**: `soc5-outbound-prod`.
3. **Application and OS Images**:
   - Choose **Ubuntu**.
   - Choose an Ubuntu Server 24.04 LTS image marked **Free tier eligible**.
   - Architecture: **64-bit (x86)**.
4. **Instance type**:
   - Choose `t3.micro` only when the console marks it Free Tier eligible for the
     account.
   - Do not select a larger type merely because another account's guide calls it
     free. Eligibility depends on account creation date and plan.
5. **Key pair**: choose `soc5-outbound-prod`.
6. **Network settings > Edit**:
   - VPC: default VPC
   - Subnet: a public subnet
   - Auto-assign public IP: **Enable**
   - Firewall: **Select existing security group**
   - Select `soc5-outbound-web`
7. **Configure storage**:
   - Root volume: 20 GiB
   - Type: `gp3`
   - Encrypted: enabled
   - Delete on termination: enabled
8. Expand **Advanced details** only to review defaults. Do not add secrets to
   user data because user data can be read from instance metadata and the AWS
   Console.
9. Review the estimated costs and Free Tier label.
10. Choose **Launch instance**.

Wait until instance state is **Running** and both status checks pass.

### Optional: allocate a stable Elastic IP

An auto-assigned public IP can change after stop/start. A stable address prevents
Cloudflare DNS from breaking.

1. Open **EC2 > Network & Security > Elastic IP addresses**.
2. Choose **Allocate Elastic IP address**.
3. Keep the Amazon IPv4 pool and choose **Allocate**.
4. Select it, then **Actions > Associate Elastic IP address**.
5. Resource type: **Instance**.
6. Select `soc5-outbound-prod` and its private IP.
7. Choose **Associate**.

AWS charges for public IPv4 usage under current pricing. An Elastic IP is not a
guarantee of zero cost; monitor Billing and release it when the instance is
deleted.

## 8. Connect to Ubuntu

From PowerShell in the folder containing the key:

```powershell
$Pem = "$env:USERPROFILE\Downloads\soc5-outbound-prod.pem"
ssh -i $Pem ubuntu@YOUR_EC2_PUBLIC_IP
```

On the first connection, verify the fingerprint shown in the EC2 connection
instructions before accepting it.

## 9. Patch the server and install Docker

Run on EC2:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl git nginx
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
sudo systemctl enable --now docker
sudo systemctl enable --now nginx
```

Sign out and reconnect so the Docker group membership applies:

```bash
exit
```

After reconnecting:

```bash
docker version
docker compose version
```

## 10. Transfer the repository

Use a repository-specific, read-only GitHub deploy key. Generate this key on the
EC2 instance, not on Windows, and do not reuse the EC2 login PEM file.

### 10.1 Generate the deploy key on EC2

At the Ubuntu prompt (`ubuntu@ip-...:~$`), run:

```bash
install -d -m 700 ~/.ssh
ssh-keygen -t ed25519 \
  -C "soc5-outbound production deploy key" \
  -f ~/.ssh/soc5_outbound_deploy \
  -N ""
chmod 600 ~/.ssh/soc5_outbound_deploy
chmod 644 ~/.ssh/soc5_outbound_deploy.pub
```

This creates:

- `~/.ssh/soc5_outbound_deploy` — private key; it stays only on EC2.
- `~/.ssh/soc5_outbound_deploy.pub` — public key; add this to GitHub.

Display the public key:

```bash
cat ~/.ssh/soc5_outbound_deploy.pub
```

Copy the complete single line beginning with `ssh-ed25519`. Never display, copy,
or paste the file without the `.pub` extension.

### 10.2 Add the public key to the private GitHub repository

In GitHub:

1. Open the private repository that contains this project.
2. Select **Settings** under the repository name. If it is hidden, open the
   repository's overflow menu and select **Settings**.
3. In the left sidebar, select **Security > Deploy keys**.
4. Select **Add deploy key**.
5. Title: `soc5-outbound-prod EC2`.
6. Key: paste the complete `ssh-ed25519 ...` public-key line.
7. Leave **Allow write access** unchecked. The server only needs to clone and
   pull; it must not push production changes back to GitHub.
8. Select **Add key** and complete GitHub password or MFA confirmation if asked.

A GitHub deploy key belongs to one repository. GitHub does not allow the same
deploy key to be reused across multiple repositories.

### 10.3 Verify GitHub's SSH host key

On EC2, retrieve GitHub's advertised Ed25519 host key into a temporary file:

```bash
ssh-keyscan -t ed25519 github.com 2>/dev/null > /tmp/github_ed25519_host_key
ssh-keygen -lf /tmp/github_ed25519_host_key
```

The fingerprint must match GitHub's currently published Ed25519 fingerprint:

```text
SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU
```

If it does not match, stop. Do not add the key or continue connecting. Check the
official GitHub SSH fingerprint documentation and investigate DNS or network
interception.

After it matches:

```bash
cat /tmp/github_ed25519_host_key >> ~/.ssh/known_hosts
chmod 600 ~/.ssh/known_hosts
rm /tmp/github_ed25519_host_key
```

### 10.4 Configure SSH to use only the deploy key

Create a dedicated SSH host alias:

```bash
nano ~/.ssh/config
```

Enter:

```sshconfig
Host github-soc5-outbound
    HostName github.com
    User git
    IdentityFile ~/.ssh/soc5_outbound_deploy
    IdentitiesOnly yes
```

Save in Nano with `Ctrl+O`, press `Enter`, and exit with `Ctrl+X`. Then run:

```bash
chmod 600 ~/.ssh/config
ssh -T git@github-soc5-outbound
```

A successful GitHub response states that authentication succeeded and shell
access is not provided. The command can return exit code 1 even when deploy-key
authentication succeeded; evaluate the message, not only the exit code.

If it returns `Permission denied (publickey)`, confirm that:

- The `.pub` key was added to the correct repository.
- The private key path in `~/.ssh/config` is correct.
- The private key permission is `600`.
- The GitHub deploy key shows as enabled.

### 10.5 Clone the repository

In GitHub, open the repository's **Code** menu, choose **Local > SSH**, and note
the path in the form `OWNER/REPOSITORY.git`. Do not use an HTTPS URL for this
deploy key.

On EC2, replace `OWNER` and `REPOSITORY` below with the actual GitHub values:

```bash
sudo mkdir -p /opt/soc5-outbound
sudo chown ubuntu:ubuntu /opt/soc5-outbound
git clone git@github-soc5-outbound:OWNER/REPOSITORY.git /opt/soc5-outbound
cd /opt/soc5-outbound
git remote -v
git status
```

Expected results:

- `git remote -v` uses the `github-soc5-outbound` SSH alias.
- `git status` reports the checked-out branch with no local changes.

If `/opt/soc5-outbound` already contains files, do not delete them blindly.
Inspect the directory and clone into a new empty directory instead.

### 10.6 Protect and rotate the deploy key

- Never commit `~/.ssh/soc5_outbound_deploy` or copy it to the repository.
- Keep **Allow write access** disabled.
- Remove the deploy key from GitHub immediately if EC2 is compromised or
  terminated.
- Generate a new key pair and replace the GitHub deploy key during rotation.
- A deployment key has no automatic expiration; include rotation in the
  operational calendar.

For a public repository, an HTTPS clone does not require a deploy key. Never copy
application `.env` files into Git.

## 11. Create production environment files

Generate a Laravel application key without storing it in shell history where
possible. A valid value starts with `base64:`. If PHP and Composer are available
locally, `php artisan key:generate --show` can generate it. Alternatively, build
the API image and run:

```bash
cd /opt/soc5-outbound
docker compose build api
docker compose run --rm api php artisan key:generate --show
```

The API image uses PHP 8.4. The committed Composer lock file contains packages
that require PHP 8.4.1 or newer; changing the runtime image back to PHP 8.3 causes
`composer/platform_check.php` to stop the build.

Create `backend/.env` with permissions restricted to the owner:

```bash
install -m 600 /dev/null backend/.env
nano backend/.env
```

Use:

```dotenv
APP_NAME="SOC 5 Outbound API"
APP_ENV=production
APP_KEY=base64:REPLACE_WITH_GENERATED_KEY
APP_DEBUG=false
APP_URL=https://soc5outboundops.app
FRONTEND_URL=https://soc5outboundops.app

LOG_CHANNEL=stderr
LOG_LEVEL=warning

DB_CONNECTION=pgsql
DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=REPLACE_WITH_EXACT_SUPABASE_POOLER_USERNAME
DB_PASSWORD=REPLACE_WITH_DATABASE_PASSWORD

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=REPLACE_WITH_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_SECRET_OR_SERVICE_ROLE_KEY

CACHE_STORE=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
```

`CACHE_STORE=file` and `QUEUE_CONNECTION=sync` avoid requiring Laravel cache and
jobs tables on this single-server MVP.

The frontend image receives public Supabase configuration at build time. Create
a root `.env` used by Docker Compose:

```bash
install -m 600 /dev/null .env
nano .env
```

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=REPLACE_WITH_PUBLISHABLE_KEY
```

The publishable key is intentionally included in browser code. The secret key
must never appear in this root file because the frontend build consumes it.

## 12. Build and start the application

From `/opt/soc5-outbound`:

```bash
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 web
```

`docker compose config` renders environment values. Do not paste its output into
tickets or chat because it can contain secrets.

Test from EC2:

```bash
curl -I http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/up
```

Expected:

- The first request returns HTTP 200.
- `/up` returns a successful Laravel health response.
- Both containers show healthy/running status.

The current Compose API command uses Laravel's built-in server. It is acceptable
only as a constrained, low-traffic MVP starting point. Before broader production
use, replace it with a production PHP runtime such as PHP-FPM behind NGINX or
FrankenPHP and perform load testing.

## 13. Create a Cloudflare Origin CA certificate

Because `.app` is HTTPS-only in modern browsers, configure TLS before publishing
DNS.

1. Open the Cloudflare dashboard.
2. Select `soc5outboundops.app`.
3. Open **SSL/TLS > Origin Server**.
4. Choose **Create Certificate**.
5. Keep **Generate private key and CSR with Cloudflare**.
6. Private key type: RSA unless organizational policy requires ECC.
7. Hostnames:
   - `soc5outboundops.app`
   - `*.soc5outboundops.app`
8. Choose an expiration period accepted by your security policy.
9. Choose **Create**.
10. Copy the certificate and private key immediately. Cloudflare does not show
    the private key again.

On EC2:

```bash
sudo install -d -m 700 /etc/nginx/cloudflare-origin
sudo nano /etc/nginx/cloudflare-origin/soc5outboundops.app.pem
sudo nano /etc/nginx/cloudflare-origin/soc5outboundops.app.key
sudo chmod 600 /etc/nginx/cloudflare-origin/soc5outboundops.app.key
sudo chmod 644 /etc/nginx/cloudflare-origin/soc5outboundops.app.pem
```

Paste the certificate into the `.pem` file and the private key into the `.key`
file. Never commit either file.

## 14. Configure host NGINX

Create `/etc/nginx/sites-available/soc5outboundops.app`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name soc5outboundops.app www.soc5outboundops.app;
    return 301 https://soc5outboundops.app$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.soc5outboundops.app;

    ssl_certificate /etc/nginx/cloudflare-origin/soc5outboundops.app.pem;
    ssl_certificate_key /etc/nginx/cloudflare-origin/soc5outboundops.app.key;
    return 301 https://soc5outboundops.app$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name soc5outboundops.app;

    ssl_certificate /etc/nginx/cloudflare-origin/soc5outboundops.app.pem;
    ssl_certificate_key /etc/nginx/cloudflare-origin/soc5outboundops.app.key;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 60s;
    }
}
```

Enable and validate it:

```bash
sudo ln -s /etc/nginx/sites-available/soc5outboundops.app /etc/nginx/sites-enabled/soc5outboundops.app
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Test the origin before changing DNS:

```bash
curl -k --resolve soc5outboundops.app:443:127.0.0.1 https://soc5outboundops.app/up
```

`-k` is used only for this loopback origin test because Cloudflare Origin CA
certificates are trusted by Cloudflare, not by the operating system's public CA
bundle. Do not use `-k` for normal public endpoint monitoring.

## 15. Configure Cloudflare DNS

In Cloudflare, open **DNS > Records** and add:

| Type | Name | Target | Proxy status | TTL |
|---|---|---|---|---|
| A | `@` | EC2 Elastic/public IPv4 | Proxied | Auto |
| CNAME | `www` | `soc5outboundops.app` | Proxied | Auto |

Do not create a DNS record for `api` with this same-origin deployment. The React
frontend calls `/api`, which host NGINX forwards through the web container.

In Cloudflare:

1. Open **SSL/TLS > Overview**.
2. Set encryption mode to **Full (strict)**.
3. Open **SSL/TLS > Edge Certificates**.
4. Enable **Always Use HTTPS**.
5. Keep **Automatic HTTPS Rewrites** enabled unless testing finds an issue.

Never use Flexible mode. Full (strict) encrypts and validates both browser-edge
and edge-origin connections.

## 16. Update Supabase production URLs

In Supabase:

1. Open **Authentication > URL Configuration**.
2. Site URL: `https://soc5outboundops.app`.
3. Redirect URLs:
   - `https://soc5outboundops.app/**`
   - `http://localhost:5173/**` only while local development is required
4. Save.

Keep `VITE_SUPABASE_URL` on the normal Supabase project URL. A paid Supabase
custom domain is not required.

## 17. End-to-end validation

Run these checks:

1. Open `https://soc5outboundops.app` in a private browser window.
2. Confirm the certificate is valid and HTTPS is used.
3. Confirm `http://soc5outboundops.app` redirects to HTTPS.
4. Select FTE and request an OTP for an active staged user.
5. Confirm the email contains a six-digit code, not a magic link.
6. Enter the code and confirm the dashboard loads.
7. Confirm `/api/auth/me` succeeds in browser developer tools.
8. Confirm an unstaged SPX email cannot create an application account.
9. Create and test one Backroom account through the FTE-only user API or UI when
   the user-management page is available.
10. Confirm first Backroom login forces a password change.
11. Confirm a disabled profile is denied access.

Server checks:

```bash
cd /opt/soc5-outbound
docker compose ps
docker compose logs --tail=200 api
docker compose logs --tail=200 web
sudo journalctl -u nginx --since "30 minutes ago"
curl -I https://soc5outboundops.app
curl -i https://soc5outboundops.app/up
```

## 18. Deploy updates

Before each deployment, take note of the current commit so rollback is possible.

```bash
cd /opt/soc5-outbound
git status
git pull --ff-only
docker compose build
docker compose up -d
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 web
```

The frontend's Supabase URL and publishable key are build-time values. Rebuild
the web image after changing them.

Rollback example:

```bash
cd /opt/soc5-outbound
git log --oneline -10
git switch --detach KNOWN_GOOD_COMMIT
docker compose build
docker compose up -d
```

Return to the deployment branch after diagnosing the failed release.

## 19. Reboot behavior

Docker is enabled at boot and Compose services use `restart: unless-stopped`.
Verify after an EC2 reboot:

```bash
sudo reboot
```

Reconnect after several minutes, then run:

```bash
docker compose -f /opt/soc5-outbound/docker-compose.yml ps
systemctl status nginx --no-pager
curl -I https://soc5outboundops.app
```

## 20. Routine operations

Weekly:

```bash
sudo apt update
apt list --upgradable
docker system df
df -h
```

Apply security updates during a maintenance window:

```bash
sudo apt upgrade -y
sudo reboot
```

Review:

- AWS Billing and Free Tier usage
- EC2 CPU, network, and status checks
- Disk usage
- Supabase database usage and Auth logs
- Cloudflare security events
- SMTP bounces and complaints

Do not run `docker system prune -a` blindly; it can remove rollback images and
build cache. Remove only resources confirmed to be unused.

## 21. Backup and recovery

Application code should remain in the Git repository. Environment files and
private keys must be backed up in an approved secrets manager, not Git.

The system of record is Supabase, so review the backup and point-in-time recovery
features of the selected Supabase plan. AWS EBS snapshots can preserve server
configuration but consume billable storage. A replacement EC2 instance should
be recoverable from:

1. Repository code
2. Documented environment variables
3. Cloudflare Origin certificate or a newly issued one
4. Supabase database and Auth data
5. This deployment guide

Test recovery instead of assuming a snapshot is usable.

## 22. Free-tier cost controls

Avoid these components for the initial deployment:

- Application Load Balancer
- NAT Gateway
- ECS/Fargate always-on services
- RDS
- Route 53 hosted zone
- CloudFront
- Paid Elastic IP assumptions
- Large or frequent EBS snapshots
- Paid Supabase custom domain

Use one eligible EC2 instance and one small encrypted `gp3` root volume. Stop or
terminate unused test instances. Release unused Elastic IPs and delete unused
volumes and snapshots. Check Billing after every infrastructure change.

## 23. Known limitations before wider production use

- One instance is a single point of failure.
- Deployments are not zero-downtime.
- The current Laravel API process uses the framework's built-in server.
- Secrets reside in restricted files on one host rather than AWS Secrets Manager.
- There is no automated CI/CD or infrastructure-as-code deployment.
- There is no application-specific metrics or alerting stack.
- Backroom user management UI is incomplete even though provisioning API support
  exists.

These limitations are acceptable only when the business explicitly accepts the
MVP risk. Resolve them before treating the system as a high-availability or
business-critical production service.

## Official references

- [AWS Free Tier](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier.html)
- [Track AWS Free Tier usage](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/tracking-free-tier-usage.html)
- [EC2 launch instance wizard](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-instance-wizard.html)
- [EC2 key pairs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
- [EC2 security groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/changing-security-group.html)
- [Supabase database connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Cloudflare Full (strict) TLS](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
