import { AddressKYCResponse } from "@/types/kyc";
import axios from "axios";

interface AddressVerificationParams {
  file: File;
  first_name: string;
  last_name: string;
  full_address: string;
  selected_document_type?: string;
}

export async function addressVerification(params: AddressVerificationParams) {
  try {
    const addressRef = `kyc_addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const base64String = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(params.file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data URL prefix (e.g., "data:image/jpeg;base64,") to get just the base64 string
        // Shufti Pro API expects only the base64 encoded string without the prefix
        const base64String = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });

    // Get auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    console.log('📤 Submitting address verification:', {
      reference: addressRef,
      documentType: params.selected_document_type,
      fullAddress: params.full_address,
      firstName: params.first_name,
      lastName: params.last_name
    });

    const response = await axios.post("/api/kyc/address", {
      reference: addressRef,
      address: {
        proof: base64String,
        supported_types: params.selected_document_type
          ? [params.selected_document_type]
          : ["utility_bill", "bank_statement", "rent_agreement"],
        full_address: params.full_address,
        name: {
          first_name: params.first_name,
          last_name: params.last_name,
          fuzzy_match: "1",
        },
        fuzzy_match: "1"
      },
    }, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      }
    });

    const data: AddressKYCResponse = response.data;
    
    // Ensure reference is set (use from response or fallback to generated one)
    data.reference = data.reference || addressRef;

    console.log('✅ Address verification response:', {
      reference: data.reference,
      event: data.event,
      status: data.verification_result?.address?.status,
      error: data.error
    });

    // If there's an error in the response but we have a reference, still return it
    // This allows the frontend to show a message but continue with the reference
    if (data.error && !data.reference) {
      const errorMessage = typeof data.error === 'string' 
        ? data.error 
        : data.error.message;
      throw new Error(errorMessage || 'Address verification failed');
    }

    return data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Error during address verification:", {
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    
    // If we have a reference in the error response, return it with error info
    const errorData = error.response?.data;
    if (errorData?.reference) {
      return {
        reference: errorData.reference,
        event: 'request.pending',
        error: errorData.error || errorData.message || error.message,
        verification_url: '',
        verification_result: {
          address: {
            status: 'pending',
            message: errorData.message || 'Address submitted but encountered an error'
          }
        },
        declined_reason: null
      } as AddressKYCResponse;
    }
    
    // Otherwise throw the error so caller can handle
    throw error;
  }
}
