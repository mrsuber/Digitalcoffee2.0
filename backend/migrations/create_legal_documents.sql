-- Create legal documents table
CREATE TABLE IF NOT EXISTS legal_documents (
  id SERIAL PRIMARY KEY,
  document_type VARCHAR(50) NOT NULL UNIQUE, -- 'terms_of_service' or 'privacy_policy'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX idx_legal_documents_active ON legal_documents(is_active);

-- Insert default documents
INSERT INTO legal_documents (document_type, title, content, version) VALUES
(
  'terms_of_service',
  'Terms of Service',
  E'# Terms of Service\n\n## 1. Acceptance of Terms\n\nBy accessing and using Digital Coffee, you accept and agree to be bound by the terms and provision of this agreement.\n\n## 2. Use License\n\nPermission is granted to temporarily access the materials (information or software) on Digital Coffee for personal, non-commercial transitory viewing only.\n\n## 3. User Accounts\n\n- You are responsible for maintaining the confidentiality of your account\n- You are responsible for all activities that occur under your account\n- You must notify us immediately of any unauthorized use\n\n## 4. Premium Subscription\n\n- Premium subscriptions provide access to enhanced features\n- Subscriptions are billed monthly or yearly\n- Refunds are subject to our refund policy\n\n## 5. Content Guidelines\n\n- Users must not post offensive or harmful content\n- We reserve the right to remove any content that violates our guidelines\n- Users retain rights to their content but grant us a license to display it\n\n## 6. Limitation of Liability\n\nDigital Coffee shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.\n\n## 7. Changes to Terms\n\nWe reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.\n\n## 8. Contact Information\n\nFor questions about these Terms, contact us at: support@digitalcoffee.cafe\n\nLast updated: ' || CURRENT_DATE,
  '1.0'
),
(
  'privacy_policy',
  'Privacy Policy',
  E'# Privacy Policy\n\n## Introduction\n\nDigital Coffee ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.\n\n## Information We Collect\n\n### Personal Information\n- Name and email address\n- Account credentials (encrypted)\n- Profile information\n- Payment information (processed securely through Stripe)\n\n### Usage Data\n- Meditation session data\n- Progress tracking information\n- App usage statistics\n- Device information\n\n### Communication Data\n- Messages with coaches\n- Community posts and comments\n- Support inquiries\n\n## How We Use Your Information\n\n- To provide and maintain our service\n- To notify you about changes to our service\n- To provide customer support\n- To gather analysis to improve our service\n- To monitor usage of our service\n- To detect and prevent technical issues\n\n## Data Storage and Security\n\n- Your data is stored securely on encrypted servers\n- We use industry-standard security measures\n- Payment information is handled by Stripe and never stored on our servers\n- We do not sell your personal information to third parties\n\n## Your Data Rights\n\nYou have the right to:\n- Access your personal data\n- Correct inaccurate data\n- Request deletion of your data\n- Export your data\n- Opt-out of marketing communications\n\n## Cookies and Tracking\n\nWe use cookies and similar tracking technologies to track activity on our service and store certain information.\n\n## Third-Party Services\n\nWe may employ third-party companies and individuals to:\n- Facilitate our service\n- Provide the service on our behalf\n- Perform service-related services\n- Assist us in analyzing how our service is used\n\n### Third Parties We Use:\n- Stripe (payment processing)\n- Firebase (push notifications)\n- Analytics services\n\n## Children''s Privacy\n\nOur service is not intended for children under 13. We do not knowingly collect personal information from children under 13.\n\n## International Data Transfers\n\nYour information may be transferred to and maintained on servers located outside of your jurisdiction where data protection laws may differ.\n\n## Changes to Privacy Policy\n\nWe may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.\n\n## Contact Us\n\nIf you have questions about this Privacy Policy, contact us at:\n- Email: privacy@digitalcoffee.cafe\n- Website: https://digitalcoffee.cafe\n\nLast updated: ' || CURRENT_DATE,
  '1.0'
)
ON CONFLICT (document_type) DO NOTHING;

-- Create document history table for version tracking
CREATE TABLE IF NOT EXISTS legal_documents_history (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES legal_documents(id),
  document_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  version VARCHAR(20),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for history queries
CREATE INDEX idx_legal_documents_history_document_id ON legal_documents_history(document_id);
CREATE INDEX idx_legal_documents_history_type ON legal_documents_history(document_type);
