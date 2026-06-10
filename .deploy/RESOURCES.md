# Deployment Resources — Soni Consultancy Services (prod)

Deployed: 2026-06-09 · AWS account `043174661808` · region `ap-south-1` (Mumbai)

## Live URL
**https://d23blg0v7gxtzv.cloudfront.net**

## Resources created
| Resource | Value |
|---|---|
| AWS CLI profile | `prod` |
| S3 bucket (private) | `scs-site-prod-043174661808` |
| Bucket region | `ap-south-1` |
| CloudFront distribution ID | `E3HVJHFD5CQPVI` |
| CloudFront domain | `d23blg0v7gxtzv.cloudfront.net` |
| Origin Access Control ID | `EZ1QNNHN5U221` |
| CloudFront Function | `scs-url-rewrite` (viewer-request, clean URLs → index.html) |
| Error responses | 403 & 404 → `/404.html` |

The bucket is **private**. Public access is only through CloudFront via OAC.

## Redeploy after editing the site
```bash
export PATH="$HOME/Library/Python/3.9/bin:$PATH"   # aws CLI location
export AWS_PROFILE=prod

# 1. Upload changed files (note: excludes docs + this .deploy folder)
aws s3 sync /Users/het/Projects/SCS s3://scs-site-prod-043174661808 \
  --delete \
  --exclude ".git/*" --exclude "*.DS_Store" \
  --exclude "README.md" --exclude "DEPLOY.md" --exclude ".deploy/*"

# 2. Invalidate the CloudFront cache so changes show immediately
aws cloudfront create-invalidation --distribution-id E3HVJHFD5CQPVI --paths "/*"
```

## If the URL-rewrite function ever needs editing
```bash
# edit .deploy/url-rewrite.js, then:
ETAG=$(aws cloudfront describe-function --name scs-url-rewrite --query ETag --output text)
aws cloudfront update-function --name scs-url-rewrite --if-match "$ETAG" \
  --function-config Comment="Rewrite clean URLs to index.html",Runtime="cloudfront-js-2.0" \
  --function-code fileb://.deploy/url-rewrite.js
ETAG=$(aws cloudfront describe-function --name scs-url-rewrite --query ETag --output text)
aws cloudfront publish-function --name scs-url-rewrite --if-match "$ETAG"
```

## Adding a custom domain later (e.g. soniconsultancyservices.com)
1. Request an ACM certificate **in us-east-1** for the domain.
2. Add the domain under the distribution's *Alternate domain names (CNAMEs)* + attach the cert.
3. Point DNS (Route 53 alias or a CNAME) at `d23blg0v7gxtzv.cloudfront.net`.
