interface ValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  export const validateData = (localData: any, supabaseData: any): ValidationResult => {
    const errors: string[] = [];
    
    // Validate companies
    const localCompanies = JSON.parse(localData.companies || '[]');
    if (localCompanies.length !== supabaseData.companies.length) {
      errors.push('Companies count mismatch');
    }
    
    // Add similar validations for other entities
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }