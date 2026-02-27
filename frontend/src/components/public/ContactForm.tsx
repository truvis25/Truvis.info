'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { companyApi } from '@/lib/api';
import { Send, CheckCircle } from 'lucide-react';

const schema = z.object({
  senderName: z.string().min(2, 'Name required').max(255),
  senderEmail: z.string().email('Valid email required'),
  senderPhone: z.string().max(50).optional(),
  subject: z.string().max(255).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

type FormData = z.infer<typeof schema>;

interface ContactFormProps {
  slug: string;
  companyName: string;
}

export function ContactForm({ slug, companyName }: ContactFormProps) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await companyApi.contact(slug, data);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-xl shadow-card p-5 text-center">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h3 className="font-semibold text-navy-900 mb-1">Message Sent!</h3>
        <p className="text-sm text-gray-500">
          Your inquiry has been sent to {companyName}. They will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-card p-5">
      <h3 className="font-semibold text-navy-900 mb-4">Contact {companyName}</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            {...register('senderName')}
            placeholder="Your full name *"
            className="input-field text-sm"
          />
          {errors.senderName && <p className="text-red-500 text-xs mt-1">{errors.senderName.message}</p>}
        </div>

        <div>
          <input
            {...register('senderEmail')}
            type="email"
            placeholder="Your email address *"
            className="input-field text-sm"
          />
          {errors.senderEmail && <p className="text-red-500 text-xs mt-1">{errors.senderEmail.message}</p>}
        </div>

        <div>
          <input
            {...register('senderPhone')}
            placeholder="Phone number (optional)"
            className="input-field text-sm"
          />
        </div>

        <div>
          <input
            {...register('subject')}
            placeholder="Subject (optional)"
            className="input-field text-sm"
          />
        </div>

        <div>
          <textarea
            {...register('message')}
            placeholder="Your message *"
            rows={4}
            className="input-field text-sm resize-none"
          />
          {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Protected by rate limiting. By sending, you agree to our Terms.
        </p>
      </form>
    </div>
  );
}
