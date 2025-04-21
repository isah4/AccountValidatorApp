export interface BankData {
  [key: string]: string;
}

export interface ValidationResult {
  isValid: boolean;
  account_number?: string;
  account_name?: string;
  first_name?: string;
  last_name?: string;
  other_name?: string;
  bank_name?: string;
  bank_code?: string;
  message?: string;
}
