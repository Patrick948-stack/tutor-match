# Tutor Match

A web-based tutoring platform for Whitman College that connects students with approved tutors. This is a prototype demonstrating the core workflows for student requests, tutor applications, and admin oversight.

## Features

**For Students:**
- Search and request tutors for specific courses
- Track tutoring requests and see assigned tutors
- Simple, intuitive interface for finding help

**For Tutors:**
- Apply for courses with GPA and transcript submission
- Add weekly availability blocks
- Manage student requests (accept/decline)
- Log tutoring hours with automatic rounding

**For Admins:**
- Review and approve tutor applications
- Monitor all tutoring requests and assignments
- View analytics on tutor hours by course and date range
- Filter time logs to track productivity

## How It Works

The app uses a smart auto-assignment system: when a student requests tutoring, an approved tutor is automatically selected based on:
- Current workload (prefers less busy tutors)
- Availability (more availability blocks = tiebreaker)
- GPA (highest performing tutors = final tiebreaker)

This keeps the matching fair and efficient without manual intervention.

## Tech Stack

- **Frontend:** Vanilla JavaScript (no frameworks)
- **Storage:** Browser localStorage (works offline, data persists locally)
- **Design:** Custom CSS for a clean, responsive UI

## Getting Started

1. Open `index.html` in your browser
2. Choose a role (Student, Tutor, or Admin)
3. Create a profile or select an existing user
4. Start exploring the platform

The prototype includes demo data to get you started right away.

## File Structure

- `index.html` - Single-page app structure with all screens
- `app.js` - All application logic and state management
- `styles.css` - Complete styling and responsive layout

## Roadmap to Production

### Missing Components for Deployment

This is currently a frontend prototype. To make it production-ready:

**Backend & Database:**
- [ ] Build REST API (Node.js/Express, Python, or similar)
- [ ] Implement real database (PostgreSQL recommended over localStorage)
- [ ] Add user authentication with secure password handling (OAuth2 or JWT)
- [ ] Implement authorization checks on all API endpoints
- [ ] Add input validation and sanitization on both frontend and backend
- [ ] Set up error handling and logging

**File Storage:**
- [ ] Move profile photo and transcript uploads to AWS S3
- [ ] Remove base64 encoding approach (memory inefficient)

**Frontend Improvements:**
- [ ] Add error handling for API failures
- [ ] Implement loading states and spinners
- [ ] Add form validation feedback
- [ ] Set up environment configuration for API endpoints

**Security & Operations:**
- [ ] Implement rate limiting on API endpoints
- [ ] Set up CORS properly for cross-origin requests
- [ ] Add HTTPS/TLS certificates
- [ ] Implement request logging and monitoring
- [ ] Add automated backups for database
- [ ] Set up alerting for errors and downtime

**Testing:**
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] End-to-end tests for critical workflows

## AWS Deployment Plan

### Architecture Overview

```
Route 53 (DNS)
    ↓
CloudFront (CDN) → S3 (Static Frontend)
    ↓
API Gateway → AppRunner (Node.js API)
                    ↓
                  RDS PostgreSQL (Database)
                    ↓
                  S3 (File Storage: Photos, Transcripts)

CloudWatch (Logs & Monitoring)
SNS (Alerts)
```

### Deployment Steps

#### Phase 1: Backend Setup (Week 1-2)
1. **Create Backend API**
   - Build Node.js/Express REST API
   - Database schema for users, applications, requests, logs
   - Authentication system (JWT tokens)
   - File upload endpoints for S3

2. **Set up RDS**
   - Create RDS PostgreSQL instance
   - Configure security groups
   - Run database migrations

3. **S3 Bucket for Files**
   - Create S3 bucket for profile photos and transcripts
   - Configure CORS for browser uploads
   - Set up lifecycle policies for cleanup

4. **Deploy to AppRunner**
   - Create AppRunner service
   - Connect to GitHub for auto-deployment
   - Set environment variables for database, S3

#### Phase 2: Frontend Deployment (Week 2)
1. **Build Optimized Frontend**
   - Connect to API endpoints
   - Add environment configuration
   - Build production bundle

2. **Deploy to S3 + CloudFront**
   - Upload static files to S3
   - Set CloudFront as CDN
   - Enable caching policies

3. **Set up Route 53**
   - Create DNS records pointing to CloudFront
   - Configure SSL/TLS certificates (ACM)

#### Phase 3: Monitoring & Operations (Week 3)
1. **CloudWatch Setup**
   - Log groups for API and database
   - Custom metrics for business events
   - Error rate dashboards

2. **SNS Alerts**
   - Alert on API errors (500s)
   - Alert on database connection failures
   - Alert on high response times

3. **Backup & Disaster Recovery**
   - Enable automated RDS backups
   - Set retention to 30 days
   - Test restore procedure

### Estimated AWS Costs (Monthly)
- **AppRunner**: ~$30-50 (API hosting)
- **RDS (PostgreSQL)**: ~$20-40 (small instance)
- **S3**: ~$1-5 (file storage & bandwidth)
- **CloudFront**: ~$5-20 (CDN)
- **Route 53**: $0.50 (DNS)
- **CloudWatch**: ~$5-10 (logs & monitoring)

**Total: ~$60-125/month** for a small production deployment

### Security Considerations
- Enable VPC for RDS (not publicly accessible)
- Use IAM roles for AppRunner to access S3
- Enable encryption at rest for S3 and RDS
- Implement request rate limiting on API Gateway
- Use security groups to restrict traffic

### Local Development
Before deploying to AWS, test locally:
```bash
# Start local PostgreSQL
docker run --name tutor-db -e POSTGRES_PASSWORD=dev -d postgres

# Start Node.js backend
cd backend && npm install && npm run dev

# Update app.js to point to http://localhost:3000
```

## Note

This is a frontend prototype. All data is stored locally in the browser and will not persist across devices. See the AWS Deployment Plan section above for production architecture.
