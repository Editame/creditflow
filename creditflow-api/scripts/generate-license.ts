import { LicenseGenerator } from '@creditflow/licensing';
import { Plan } from '@creditflow/shared-types';
import * as fs from 'fs';
import * as path from 'path';

const privateKeyPath = path.join(process.cwd(), 'keys', 'private.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');

const generator = new LicenseGenerator(privateKey);

const licenseData = {
  tenantName: 'Demo Company',
  contactEmail: 'demo@example.com',
  plan: Plan.PROFESSIONAL,
  perpetual: false,
  supportYears: 1,
};

const license = generator.generate(licenseData);

const outputPath = path.join(process.cwd(), 'license-demo.json');
fs.writeFileSync(outputPath, JSON.stringify(license, null, 2));

console.log('✅ License generated successfully!');
console.log('📁 Location:', outputPath);
