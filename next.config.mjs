/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        'import.meta.env': JSON.stringify(process.env),
      })
    );
    return config;
  },
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.VITE_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    VITE_OPENROUTER_API_KEY: process.env.VITE_OPENROUTER_API_KEY || '',
    VITE_DEFAULT_MODEL: process.env.VITE_DEFAULT_MODEL || 'google/gemini-3.6-flash',
    VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY || '',
    VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || '',
    VITE_NVIDIA_API_KEY: process.env.VITE_NVIDIA_API_KEY || '',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
    VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY || '',
    VITE_XKIRO_API_KEY: process.env.VITE_XKIRO_API_KEY || '',
    VITE_RAZORPAY_KEY_ID: process.env.VITE_RAZORPAY_KEY_ID || '',
  }
};

export default nextConfig;
