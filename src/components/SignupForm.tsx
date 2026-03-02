// zuperior-dashboard/client/src/components/SignupForm.tsx (Example)

'use client'; // Assuming Next.js App Router Client Component

import { useState } from 'react';
import { authService } from '../services/api.service';
import { useRouter } from 'next/navigation';

const SignupForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    country: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.register(formData);

      // 1. Store Auth Data (Token & Client ID)
      authService.setAuthData(data.token, data.clientId);

      // 2. Update Redux/Context (Mocked - replace with your actual state update)

      // 3. Redirect to the Dashboard
      router.push('/dashboard');

    } catch (err: any) {
      // Axios errors are wrapped in 'response.data.message'
      const errorMessage = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Create Account</h2>

      {/* Input Fields */}
      <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className="mb-3 p-2 border w-full" />
      <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="mb-3 p-2 border w-full" />
      <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="mb-3 p-2 border w-full" />
      <input type="text" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="mb-3 p-2 border w-full" />
      <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleChange} className="mb-3 p-2 border w-full" />

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white p-3 rounded w-full hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Register'}
      </button>

      <p className="mt-4 text-center">
        Already have an account? <a href="/login" className="text-blue-600 hover:underline">Login here</a>
      </p>
    </form>
  );
};

export default SignupForm;