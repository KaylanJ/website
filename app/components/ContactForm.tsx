'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("TRANSMITTING_DATA...");

    const { error } = await supabase.from('messages').insert([{
      sender_name: formData.name,
      sender_email: formData.email,
      subject: formData.subject,
      content: formData.message
    }]);

    if (error) {
      console.error(error);
      setStatus("ERROR: UPLINK_CRITICAL_FAILURE");
    } else {
      setStatus("SUCCESS: SIGNAL_ARCHIVED. KAYLAN_J_WILL_REVIEW_LOGS.");
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus(""), 6000); // Clear status after 6 seconds
    }
  };

  return (
    <div className="nes-container is-dark with-title max-w-2xl mx-auto">
      <p className="title text-[7px]">COMMUNICATIONS_UPLINK</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="nes-field">
          <label className="text-[7px] uppercase">Name</label>
          <input required placeholder="YOUR_NAME" className="nes-input is-dark text-[7px]" 
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        
        <div className="nes-field">
          <label className="text-[7px] uppercase">Email</label>
          <input required type="email" placeholder="YOUR@EMAIL.COM" className="nes-input is-dark text-[7px]" 
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>

        <div className="nes-field">
          <label className="text-[7px] uppercase">Subject</label>
          <input required placeholder="REASON_FOR_CONTACT" className="nes-input is-dark text-[7px]" 
            value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
        </div>

        <div className="nes-field">
          <label className="text-[7px] uppercase">Message</label>
          <textarea required placeholder="TYPE_MESSAGE_HERE..." className="nes-textarea is-dark text-[6px] h-24" 
            value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
        </div>

        <button type="submit" className="nes-btn is-primary w-full text-[7px]">SEND</button>
        
        {status && (
          <div className="mt-3 p-2 border-2 border-dotted border-yellow-500 text-center">
            <p className="nes-text is-warning text-[7px] animate-pulse uppercase">{status}</p>
          </div>
        )}
      </form>
    </div>
  );
}